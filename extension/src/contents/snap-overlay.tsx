import cssText from "data-text:@/style.css";
import { useEffect, useRef, useState } from "react";

import { sendToBackground } from "@plasmohq/messaging";

export function getStyle() {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
}

enum MouseButton {
  Left,
  Middle,
  Right
}

export default function SnapOverlay() {
  const [isSnapping, setIsSnapping] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const coordinates = useRef<BoxCoordinates>({
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 }
  });

  function cancel() {
    isDrawing.current = false;
    setIsSnapping(false);
  }

  useEffect(() => {
    function handleMessage(request: { message: string }) {
      if (request.message === "begin-snap") setIsSnapping(true);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") cancel();
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    document.addEventListener("keydown", handleEscape);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isSnapping) return;

    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    function handleMouseDown(event: MouseEvent) {
      const buttonClicked = event.button;
      if (buttonClicked === MouseButton.Left) {
        ctx.beginPath();
        ctx.moveTo(event.clientX, event.clientY);
        coordinates.current.start = { x: event.clientX, y: event.clientY };
        isDrawing.current = true;
      } else if (isDrawing.current) {
        cancel();
      }
    }

    function handleMouseMove(event: MouseEvent) {
      if (isDrawing.current) {
        const startPosition = coordinates.current.start;
        const rectWidth = event.clientX - startPosition.x;
        const rectHeight = event.clientY - startPosition.y;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.clearRect(startPosition.x, startPosition.y, rectWidth, rectHeight);
        ctx.strokeRect(startPosition.x, startPosition.y, rectWidth, rectHeight);
      }
    }

    async function handleMouseUp(event: MouseEvent) {
      if (isDrawing.current) {
        setIsSnapping(false);
        isDrawing.current = false;
        coordinates.current.end = { x: event.clientX, y: event.clientY };
        // Ensure that the start and end coordinates are in the correct order
        if (coordinates.current.start.x > coordinates.current.end.x) {
          [coordinates.current.start.x, coordinates.current.end.x] = [
            coordinates.current.end.x,
            coordinates.current.start.x
          ];
        }
        if (coordinates.current.start.y > coordinates.current.end.y) {
          [coordinates.current.start.y, coordinates.current.end.y] = [
            coordinates.current.end.y,
            coordinates.current.start.y
          ];
        }
        await sendToBackground({
          name: "send-snap-to-panel",
          body: {
            coordinates: coordinates.current
          }
        }).then(() => {});
      }
    }

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
    };
  }, [canvasRef, isSnapping]);

  if (!isSnapping) return null;

  return (
    <div className="fixed h-screen w-screen">
      <canvas
        ref={canvasRef}
        className="cursor-crosshair"
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
}
