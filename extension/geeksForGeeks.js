// Content script for GeeksforGeeks submission detection

(async function () {
  console.log("GeeksforGeeks extension content script loaded");
  
  let lastSubmissionKey = null;
  let attemptsCount = 0;
  let isMonitoring = false;

  async function getEmail() {
    return new Promise((res) => {
      chrome.storage.sync.get(["email"], (result) => {
        res(result.email || null);
      });
    });
  }

  // Check if we're on a problem page and start monitoring
  function startMonitoring() {
    if (isMonitoring) return;
    
    // Check if we're on a problem page
    const isProblemPage = window.location.pathname.includes('/problems/') || 
                         window.location.pathname.includes('/practice/') ||
                         document.querySelector('.problem-statement, .practice-problem');
    
    if (!isProblemPage) return;
    
    console.log("Starting GeeksforGeeks submission monitoring...");
    isMonitoring = true;
    
    // Start polling for submissions
    setInterval(checkSubmission, 5000); // Check every 5 seconds
    
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
            '.success', '.correct', '.accepted',
            '[data-e2e-locator="submission-result"]',
            '.submission-result', '.result-success',
            '.alert-success', '.alert-info'
          ];
          
          for (const selector of resultSelectors) {
            const resultElements = document.querySelectorAll(selector);
            if (resultElements.length > 0) {
              console.log("Submission result detected in DOM:", selector);
              setTimeout(checkSubmission, 1000); // Check after a short delay
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

  // Check submission success on GeeksforGeeks problem page
  async function checkSubmission() {
    try {
      const email = await getEmail();
      if (!email) {
        console.log("No email found in storage");
        return;
      }

      // Try multiple approaches to get submission data
      const submissionData = await getSubmissionData();
      
      if (!submissionData) return;

      if (submissionData.key === lastSubmissionKey) return;

      lastSubmissionKey = submissionData.key;

      if (submissionData.status === "Accepted" || submissionData.status === "Correct") {
        attemptsCount++;

        const data = {
          email,
          platform: "gfg",
          problemTitle: submissionData.title,
          problemSlug: submissionData.slug,
          submissionTime: new Date().toISOString(),
          attempts: attemptsCount,
          language: submissionData.language || "unknown"
        };

        console.log("Sending GeeksforGeeks submission data:", data);

        chrome.runtime.sendMessage({ type: "submitData", data }, (response) => {
          if (!response || !response.success) {
            console.error("Failed to send GeeksforGeeks submission data", response);
          } else {
            console.log("GeeksforGeeks submission synced successfully:", response);
          }
        });
      }
    } catch (err) {
      console.error("Error checking GeeksforGeeks submission:", err);
    }
  }

  // Try multiple methods to get submission data
  async function getSubmissionData() {
    // Method 1: Check for success messages in DOM
    try {
      const successSelectors = [
        '.success', '.correct', '.accepted',
        '[data-e2e-locator="submission-result"]',
        '.submission-result', '.result-success',
        '.alert-success', '.alert-info'
      ];
      
      for (const selector of successSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const currentProblem = getCurrentProblemInfo();
          if (currentProblem) {
            return {
              key: currentProblem.title + element.textContent + Date.now(),
              title: currentProblem.title,
              slug: currentProblem.slug,
              status: element.textContent.trim(),
              language: getLanguageFromPage()
            };
          }
        }
      }
    } catch (err) {
      console.log("DOM method failed");
    }

    // Method 2: Check for submission table or results
    try {
      const submissionTable = document.querySelector('.submissions-table, .results-table');
      if (submissionTable) {
        const rows = submissionTable.querySelectorAll('tr');
        if (rows.length > 1) {
          const latestRow = rows[1]; // First row is usually header
          const statusCell = latestRow.querySelector('td:nth-child(2), .status');
          const timeCell = latestRow.querySelector('td:nth-child(3), .time');
          
          if (statusCell && timeCell) {
            const currentProblem = getCurrentProblemInfo();
            if (currentProblem) {
              return {
                key: currentProblem.title + statusCell.textContent + timeCell.textContent,
                title: currentProblem.title,
                slug: currentProblem.slug,
                status: statusCell.textContent.trim(),
                language: getLanguageFromPage()
              };
            }
          }
        }
      }
    } catch (err) {
      console.log("Table method failed");
    }

    // Method 3: Check for practice problem results
    try {
      const practiceResult = document.querySelector('.practice-result, .problem-result');
      if (practiceResult) {
        const currentProblem = getCurrentProblemInfo();
        if (currentProblem) {
          return {
            key: currentProblem.title + practiceResult.textContent + Date.now(),
            title: currentProblem.title,
            slug: currentProblem.slug,
            status: practiceResult.textContent.trim(),
            language: getLanguageFromPage()
          };
        }
      }
    } catch (err) {
      console.log("Practice result method failed");
    }

    return null;
  }

  // Get current problem information from the page
  function getCurrentProblemInfo() {
    try {
      // Try multiple selectors for problem title
      const titleSelectors = [
        'h1', '.problem-title', '.practice-title',
        '[data-e2e-locator="problem-title"]',
        '.gfg-problem-title', '.question-title'
      ];
      
      let title = null;
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          title = element.textContent.trim();
          break;
        }
      }
      
      if (!title) {
        // Try to get from URL
        const pathParts = window.location.pathname.split('/');
        const problemIndex = pathParts.findIndex(part => part === 'problems' || part === 'practice');
        if (problemIndex !== -1 && pathParts[problemIndex + 1]) {
          title = pathParts[problemIndex + 1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }
      
      if (title) {
        // Generate slug from title
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        
        return {
          title: title,
          slug: slug
        };
      }
    } catch (err) {
      console.error("Error getting problem info:", err);
    }
    
    return null;
  }

  // Try to detect the programming language used
  function getLanguageFromPage() {
    try {
      // Look for language indicators in the page
      const languageSelectors = [
        '.language-selector', '.code-language',
        '[data-language]', '.editor-language'
      ];
      
      for (const selector of languageSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent.trim() || element.getAttribute('data-language');
        }
      }
      
      // Check for language in code blocks
      const codeBlocks = document.querySelectorAll('pre code, .code-block');
      for (const block of codeBlocks) {
        const className = block.className;
        if (className.includes('cpp')) return 'C++';
        if (className.includes('java')) return 'Java';
        if (className.includes('python')) return 'Python';
        if (className.includes('javascript')) return 'JavaScript';
        if (className.includes('csharp')) return 'C#';
      }
      
    } catch (err) {
      console.error("Error detecting language:", err);
    }
    
    return "unknown";
  }

  // Start monitoring when the page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMonitoring);
  } else {
    startMonitoring();
  }

  // Also start monitoring when navigating to new problems
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      isMonitoring = false;
      lastSubmissionKey = null;
      attemptsCount = 0;
      setTimeout(startMonitoring, 1000);
    }
  }, 1000);

})();
