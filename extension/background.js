// Listen for messages from content scripts and forward them to backend

console.log("Background script loaded");

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("Received message:", message);
  
  if (message.type === "submitData") {
    try {
      console.log("Sending submission data to backend:", message.data);
      
      const response = await fetch("http://localhost:3001/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(message.data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const resJson = await response.json();
      console.log("Backend response:", resJson);
      sendResponse({ success: true, data: resJson });
    } catch (err) {
      console.error("Error sending data to backend:", err);
      sendResponse({ success: false, error: err.message });
    }
    return true; // Keep the message channel open for async response
  }
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
});
