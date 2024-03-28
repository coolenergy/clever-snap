import { type PlasmoMessaging } from "@plasmohq/messaging";

const PORT = process.env.PLASMO_PUBLIC_PORT || 3000;

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const imgUri: string = req.body.imgUri;
  try {
    const { answer } = await fetch(`http://localhost:${PORT}/answer/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imgUri })
    }).then((res) => res.json());
    res.send(answer);
  } catch (error) {
    console.error(error);
  }
};

export default handler;
