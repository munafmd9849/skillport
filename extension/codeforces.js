// codeforces.js
console.log("📡 SkillPort Codeforces Tracker Active"); 

// Content script for Codeforces submission detection

(async function () {
  // Track submission state
  let lastSubmissionId = null;
  let attemptsCount = 0;
  let isMonitoring = false;
  let submissionInProgress = false;
  let lastSubmissionTime = 0;
  const SUBMISSION_COOLDOWN = 5000; // 5 seconds cooldown between submissions

  async function getEmail() {
    return new Promise((res) => {
      chrome.storage.sync.get(["email"], (result) => {
        res(result.email || null);
      });
    });
  }

  // Check if we're on a submission page and start monitoring
  function startMonitoring() {
    if (isMonitoring) return;
    
    // Check if we're on a submission or contest page
    const isSubmissionPage = window.location.pathname.includes('/submission/') ||
                            window.location.pathname.includes('/status') ||
                            window.location.pathname.includes('/contest/');
    
    if (!isSubmissionPage) return;
    
    console.log("Starting Codeforces submission monitoring...");
    isMonitoring = true;
    
    // Start polling for submissions
    setInterval(debouncedCheckSubmission, 5000); // Check every 5 seconds
    
    // Also monitor for DOM changes that might indicate submission
    monitorDOMChanges();
  }

  // Monitor DOM changes for submission indicators
  function monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Look for various submission result elements
          const resultSelectors = [
            '.verdict-accepted', '.verdict-wa', '.verdict-tle',
            '[data-e2e-locator="submission-verdict"]',
            '.submission-verdict', '.result-accepted',
            '.status-accepted', '.status-wrong'
          ];
          
          for (const selector of resultSelectors) {
            const resultElements = document.querySelectorAll(selector);
            if (resultElements.length > 0) {
              console.log("Submission result detected in DOM:", selector);
              debouncedCheckSubmission(); // Use debounced version
              break;
            }
          }
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Debounce function to limit how often we check submissions
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // Debounced version of checkSubmission
  const debouncedCheckSubmission = debounce(checkSubmission, 1000);
  
  // Check submission success on Codeforces
  async function checkSubmission() {
    try {
      // Prevent duplicate processing
      const now = Date.now();
      if (submissionInProgress || now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
        console.log("⏱️ Submission cooldown active or submission in progress, skipping...");
        return;
      }
      
      const email = await getEmail();
      if (!email) {
        console.log("No email found in storage");
        return;
      }

      // Try multiple approaches to get submission data
      const submissionData = await getSubmissionData();
      
      if (!submissionData) return;

      if (submissionData.id === lastSubmissionId) return;
      
      // Set flags to prevent duplicate submissions
      submissionInProgress = true;
      lastSubmissionTime = now;
      lastSubmissionId = submissionData.id;

      if (submissionData.verdict === "Accepted" || submissionData.verdict === "OK") {
        attemptsCount++;

        // Extract username from Codeforces page
        let codeforcesUsername = null;
        try {
          const userElement = document.querySelector('.user-name, .rated-user, .handle');
          if (userElement) {
            codeforcesUsername = userElement.textContent.trim();
          }
        } catch (err) {
          console.error("Error extracting username:", err);
        }
        
        // Create simplified data object with only required fields
        const data = {
          username: codeforcesUsername || '<not found>',
          email: email || '<not found>',
          url: window.location.href,
          slug: submissionData.slug,
          timestamp: new Date().toISOString(),
          platform: "codeforces",
          attempts: attemptsCount
        };

        // Log clean JSON object to console
        console.log(JSON.stringify(data, null, 2));

        chrome.runtime.sendMessage({ type: "submitData", data }, (response) => {
          submissionInProgress = false; // Reset flag after submission attempt
          
          if (!response || !response.success) {
            console.error("Failed to send Codeforces submission data", response);
          } else {
            console.log("Codeforces submission synced successfully:", response);
          }
        });
      }
    } catch (err) {
      console.error("Error checking Codeforces submission:", err);
      submissionInProgress = false; // Reset flag on error
    }
  }

  // Try multiple methods to get submission data
  async function getSubmissionData() {
    // Method 1: Check for submission details on submission page
    try {
      if (window.location.pathname.includes('/submission/')) {
        const submissionId = window.location.pathname.split('/submission/')[1];
        const verdictElement = document.querySelector('.verdict-accepted, .verdict-wa, .verdict-tle, .verdict');
        const problemElement = document.querySelector('.problem-title, .title');
        const languageElement = document.querySelector('.language, .programming-language');
        
        if (verdictElement && problemElement) {
          return {
            id: submissionId,
            title: problemElement.textContent.trim(),
            slug: problemElement.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            verdict: verdictElement.textContent.trim(),
            language: languageElement ? languageElement.textContent.trim() : "unknown",
            contestId: getContestIdFromUrl()
          };
        }
      }
    } catch (err) {
      console.log("Submission page method failed");
    }

    // Method 2: Check for submissions in status table
    try {
      const statusTable = document.querySelector('.status-frame-datatable, .submissions-table');
      if (statusTable) {
        const rows = statusTable.querySelectorAll('tr');
        if (rows.length > 1) {
          const latestRow = rows[1]; // First row is usually header
          const verdictCell = latestRow.querySelector('.verdict-accepted, .verdict-wa, .verdict-tle, .verdict');
          const problemCell = latestRow.querySelector('.problem-title, .title');
          const timeCell = latestRow.querySelector('.time, .submission-time');
          
          if (verdictCell && problemCell) {
            return {
              id: Date.now(), // Generate unique ID
              title: problemCell.textContent.trim(),
              slug: problemCell.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              verdict: verdictCell.textContent.trim(),
              language: "unknown",
              contestId: getContestIdFromUrl()
            };
          }
        }
      }
    } catch (err) {
      console.log("Status table method failed");
    }

    // Method 3: Check for contest submissions
    try {
      if (window.location.pathname.includes('/contest/')) {
        const contestSubmissions = document.querySelectorAll('.verdict-accepted');
        if (contestSubmissions.length > 0) {
          const latestSubmission = contestSubmissions[0];
          const problemElement = latestSubmission.closest('tr').querySelector('.problem-title, .title');
          
          if (problemElement) {
            return {
              id: Date.now(),
              title: problemElement.textContent.trim(),
              slug: problemElement.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              verdict: "Accepted",
              language: "unknown",
              contestId: getContestIdFromUrl()
            };
          }
        }
      }
    } catch (err) {
      console.log("Contest submissions method failed");
    }

    return null;
  }

  // Get contest ID from URL
  function getContestIdFromUrl() {
    try {
      const pathParts = window.location.pathname.split('/');
      const contestIndex = pathParts.findIndex(part => part === 'contest');
      if (contestIndex !== -1 && pathParts[contestIndex + 1]) {
        return pathParts[contestIndex + 1];
      }
    } catch (err) {
      console.error("Error getting contest ID:", err);
    }
    return null;
  }

  // Start monitoring when the page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMonitoring);
  } else {
    startMonitoring();
  }

  // Also start monitoring when navigating to new pages
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      isMonitoring = false;
      lastSubmissionId = null;
      attemptsCount = 0;
      submissionInProgress = false;
      lastSubmissionTime = 0;
      console.log("🔄 URL changed, resetting submission tracker");
      setTimeout(startMonitoring, 1000);
    }
  }, 1000);

})();