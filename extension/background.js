// Listen for messages from content scripts and forward them to backend

console.log("Background script loaded");

// Configuration for backend endpoints
const CONFIG = {
  // Primary endpoint (server implementation)
  serverEndpoint: "http://localhost:5000/api/submissions/extension",
  // Fallback endpoint (legacy implementation - for backward compatibility)
  backendEndpoint: "http://localhost:5000/api/submissions"
};

// Log the configuration for debugging
console.log("Backend configuration:", CONFIG);

// Track submissions to avoid duplicates
const submissionTracker = {
  lastSubmission: null,
  lastTimestamp: 0,
  
  // Check if this is a duplicate submission (within 10 seconds)
  isDuplicate: function(data) {
    if (!this.lastSubmission) return false;
    
    const now = Date.now();
    const timeDiff = now - this.lastTimestamp;
    
    // If it's the same URL and within 10 seconds, consider it a duplicate
    if (data.url === this.lastSubmission.url && timeDiff < 10000) {
      console.log("Duplicate submission detected, ignoring");
      return true;
    }
    
    return false;
  },
  
  // Record this submission
  recordSubmission: function(data) {
    this.lastSubmission = data;
    this.lastTimestamp = Date.now();
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  
  if (message.type === "submitData") {
    // Check for required fields
    if (!message.data || !message.data.platform || !message.data.url) {
      console.error("Missing required submission data");
      sendResponse({ success: false, error: "Missing required submission data" });
      return true;
    }
    
    // Check for duplicate submissions
    if (submissionTracker.isDuplicate(message.data)) {
      sendResponse({ success: true, data: { message: "Duplicate submission ignored" } });
      return true;
    }
    
    // Record this submission to prevent duplicates
    submissionTracker.recordSubmission(message.data);
    
    // Process the submission asynchronously
    (async () => {
      try {
        console.log("Sending submission data to backend:", message.data);
        
        // Try the server endpoint first, fall back to backend if it fails
        let endpoint = CONFIG.serverEndpoint;
        let response;
        
        try {
          console.log(`Attempting to send data to ${endpoint}`);
          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(message.data)
          });
          console.log(`Response status from ${endpoint}:`, response.status);
        } catch (err) {
          console.error(`Error with primary endpoint ${endpoint}:`, err);
          endpoint = CONFIG.backendEndpoint;
          console.log(`Trying fallback endpoint ${endpoint}`);
          try {
            response = await fetch(endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(message.data)
            });
            console.log(`Response status from fallback ${endpoint}:`, response.status);
          } catch (fallbackErr) {
            console.error(`Error with fallback endpoint ${endpoint}:`, fallbackErr);
            throw fallbackErr;
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        }
        
        const resJson = await response.json();
        console.log("Backend response:", resJson);
        sendResponse({ success: true, data: resJson });
      } catch (err) {
        console.error("Error sending data to backend:", err);
        sendResponse({ success: false, error: err.message });
      }
    })();
    
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
