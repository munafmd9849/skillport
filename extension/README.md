# SkillPort Submission Tracker Extension

This Chrome extension tracks your coding submissions on LeetCode, GeeksforGeeks, and Codeforces.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked" and select the `extension` folder
4. The extension should now appear in your extensions list

## Setup

1. Click on the extension icon in your browser toolbar
2. Enter your email address and click "Save Email"
3. Click "Test Backend Connection" to verify your backend server is running
4. Make sure your backend server is running on `http://localhost:3000`

## How it Works

### LeetCode
- The extension automatically detects when you're on a LeetCode problem page
- It monitors for successful submissions and sends the data to your backend
- Works with both the API and DOM-based detection methods

### GeeksforGeeks
- Monitors submissions on GeeksforGeeks problem pages
- Tracks successful submissions and sends data to backend

### Codeforces
- Monitors submissions on Codeforces contest and problem pages
- Tracks successful submissions and sends data to backend

## Troubleshooting

1. **Extension not working?**
   - Check the browser console for any error messages
   - Make sure the extension is enabled in `chrome://extensions/`
   - Reload the extension if you make changes

2. **No submissions detected?**
   - Make sure you're on a supported page (problem page for the respective platform)
   - Check that your email is set in the extension popup
   - Look for console logs that indicate the script is running

3. **Backend connection failed?**
   - Ensure your backend server is running on `http://localhost:3000`
   - Check that the `/api/submissions` endpoint exists and accepts POST requests
   - Verify CORS settings if needed

## Console Logs

The extension provides detailed console logs to help with debugging:
- "LeetCode extension content script loaded" - Script is running
- "Starting LeetCode submission monitoring..." - Monitoring started
- "Submission result detected in DOM" - Submission detected
- "Sending LeetCode submission data" - Data being sent to backend

## Data Format

The extension sends the following data to your backend:

```json
{
  "email": "user@example.com",
  "platform": "leetcode",
  "problemTitle": "Two Sum",
  "problemSlug": "two-sum",
  "submissionTime": "2024-01-01T12:00:00.000Z",
  "attempts": 1,
  "language": "javascript"
}
``` 