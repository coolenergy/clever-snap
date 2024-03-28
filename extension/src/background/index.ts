chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { message: "toggle-panel" });
});

chrome.runtime.onMessage.addListener((req) => {
  if (req.message === "begin-snap") {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      chrome.tabs.sendMessage(tab.id, { message: "begin-snap" });
    });
  }
});
