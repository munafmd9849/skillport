// Content script for LeetCode submission detection

(async function () {
  console.log("LeetCode extension content script loaded");
  
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
    const isProblemPage = window.location.pathname.includes('/problems/');
    if (!isProblemPage) return;
    console.log("Starting LeetCode submission monitoring...");
    isMonitoring = true;
    setInterval(checkSubmission, 5000); // Check every 5 seconds
    monitorDOMChanges();
  }

  // Monitor DOM changes for submission indicators
  function monitorDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          let resultElements = document.querySelectorAll('[data-e2e-locator="console-result"], .result__2cm');
          // Fallback: look for any element containing 'Accepted' or 'Wrong Answer'
          if (resultElements.length === 0) {
            resultElements = Array.from(document.querySelectorAll('*')).filter(el => {
              const txt = el.textContent || '';
              return txt.includes('Accepted') || txt.includes('Wrong Answer') || txt.includes('Runtime Error') || txt.includes('Time Limit Exceeded');
            });
          }
          if (resultElements.length > 0) {
            console.log("Submission result detected in DOM (fallback included)");
            setTimeout(checkSubmission, 1000); // Check after a short delay
          }
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Check submission success on LeetCode problem page (DOM only)
  async function checkSubmission() {
    try {
      const email = await getEmail();
      if (!email) {
        console.log("[SkillPort DEBUG] No email found in storage");
      } else {
        console.log("[SkillPort DEBUG] Email found:", email);
      }
      // Extract problemSlug from URL
      let problemSlug = null;
      const slugMatch = window.location.pathname.match(/problems\/([^\/]+)\//);
      if (slugMatch) {
        problemSlug = slugMatch[1];
        console.log('[SkillPort DEBUG] problemSlug from URL:', problemSlug);
      } else {
        console.log('[SkillPort DEBUG] Could not extract problemSlug from URL:', window.location.pathname);
      }
      // Generate problemTitle from slug
      let problemTitle = problemSlug ? problemSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '<not found>';
      if (problemSlug) {
        console.log('[SkillPort DEBUG] problemTitle generated from slug:', problemTitle);
      }
      // Extract verdict from DOM (look for result text)
      let verdict = '<not found>';
      const resultElement = document.querySelector('[data-e2e-locator="console-result"], .result__2cm');
      if (resultElement && resultElement.textContent) {
        verdict = resultElement.textContent.trim();
        console.log('[SkillPort DEBUG] verdict from resultElement:', verdict);
      } else {
        // Fallback: look for any VISIBLE element containing verdict keywords
        const fallbackVerdict = Array.from(document.querySelectorAll('*')).find(el => {
          // Ignore style/script and hidden elements
          if (
            el.tagName === 'STYLE' ||
            el.tagName === 'SCRIPT' ||
            el.offsetParent === null ||
            !el.textContent ||
            el.textContent.trim().length === 0
          ) return false;
          const txt = el.textContent;
          return txt.includes('Accepted') || txt.includes('Wrong Answer') || txt.includes('Runtime Error') || txt.includes('Time Limit Exceeded');
        });
        if (fallbackVerdict) {
          verdict = fallbackVerdict.textContent.trim();
          console.log('[SkillPort DEBUG] verdict from fallback:', verdict);
        }
      }
      // Extract code from Monaco editor
      const codeElement = document.querySelector('.view-lines');
      let code = codeElement ? codeElement.innerText : null;
      if (!code) {
        const textarea = document.querySelector('textarea');
        code = textarea ? textarea.value : null;
      }
      if (code) {
        console.log("[SkillPort DEBUG] Code extracted:", code.substring(0, 100));
      } else {
        console.log("[SkillPort DEBUG] No code extracted");
      }
      // Extract LeetCode username from DOM
      let leetcodeUsername = null;
      const userMenu = document.querySelector('a[href^="/u/"]');
      if (userMenu) {
        const match = userMenu.getAttribute('href').match(/\/(?:u|profile)\/([^\/]+)/);
        if (match) {
          leetcodeUsername = match[1];
        }
      }
      if (!leetcodeUsername) {
        const avatar = document.querySelector('img[alt*=\'\'s avatar\']');
        if (avatar && avatar.alt) {
          leetcodeUsername = avatar.alt.replace(/'s avatar.*/, '').trim();
        }
      }
      if (!leetcodeUsername) {
        const dropdown = document.querySelector('[data-cy="header-user-menu"] span');
        if (dropdown) {
          leetcodeUsername = dropdown.textContent.trim();
        }
      }
      if (leetcodeUsername) {
        console.log("[SkillPort DEBUG] Username extracted:", leetcodeUsername);
      } else {
        console.log("[SkillPort DEBUG] No username extracted");
      }
      // Compose the minimal data object as requested
      const data = {
        leetcodeUsername: leetcodeUsername || '<not found>',
        email: email || '<not found>',
        problemTitle: problemTitle,
        problemSlug: problemSlug || '<not found>',
        verdict: verdict,
        timestamp: new Date().toISOString()
      };
      // Only log if slug is found and not a duplicate
      if (problemSlug && verdict !== '<not found>') {
        if (data.problemSlug === lastSubmissionKey) {
          console.log('[SkillPort DEBUG] Duplicate submission, skipping log.');
          return;
        }
        lastSubmissionKey = data.problemSlug;
        console.log('[SkillPort LeetCode Extracted JSON]', data);
      }
      if (verdict === "Accepted") {
        attemptsCount++;
        chrome.runtime.sendMessage({ type: "submitData", data }, (response) => {
          if (!response || !response.success) {
            console.error("Failed to send LeetCode submission data", response);
          } else {
            console.log("LeetCode submission synced successfully:", response);
          }
        });
      }
    } catch (err) {
      console.error("Error checking LeetCode submission:", err);
    }
  }

  // Extract submission data from DOM
  function getSubmissionDataFromDOM() {
    try {
      // Look for the result panel
      const resultElement = document.querySelector('[data-e2e-locator="console-result"], .result__2cm');
      if (!resultElement) return null;
      const status = resultElement.textContent.includes("Accepted") ? "Accepted" : resultElement.textContent.trim();
      const currentProblem = getCurrentProblemInfo();
      if (!currentProblem) return null;
      return {
        key: currentProblem.title + status + Date.now(),
        title: currentProblem.title,
        slug: currentProblem.slug,
        status: status,
        language: getLanguageFromPage()
      };
    } catch (err) {
      console.error("Error extracting submission data from DOM:", err);
      return null;
    }
  }

  // Get current problem information from the page
  function getCurrentProblemInfo() {
    try {
      const pathParts = window.location.pathname.split('/');
      let problemSlug = null;
      if (pathParts.includes('problems')) {
        problemSlug = pathParts[pathParts.indexOf('problems') + 1];
      }
      if (!problemSlug) {
        // Fallback: try to find slug in URL
        const match = window.location.pathname.match(/problems\/([^\/]+)/);
        if (match) problemSlug = match[1];
      }
      if (problemSlug) {
        // Try multiple selectors for the title
        let title = null;
        const selectors = [
          'h1',
          '[data-e2e-locator="question-title"]',
          '.css-v3d350', // LeetCode new UI
          '.question-title',
          '.title',
          '.text-label-1',
          '.mr-2.text-label-1',
        ];
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          if (el && el.textContent && el.textContent.trim().length > 0) {
            title = el.textContent.trim();
            console.log('[SkillPort DEBUG] Title found with selector', selector, ':', title);
            break;
          }
        }
        if (!title) {
          // Fallback: use slug as title
          title = problemSlug.replace(/-/g, ' ');
          console.log('[SkillPort DEBUG] Title fallback to slug:', title);
        }
        return {
          title: title,
          slug: problemSlug
        };
      } else {
        console.log('[SkillPort DEBUG] Could not extract problemSlug from URL:', window.location.pathname);
      }
    } catch (err) {
      console.error("Error getting problem info:", err);
    }
    return null;
  }

  // Try to detect the programming language used
  function getLanguageFromPage() {
    try {
      const languageSelectors = [
        '.ant-select-selection-item',
        '.language-selector',
        '[data-cy="lang-select"]',
        '[data-language]'
      ];
      for (const selector of languageSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.textContent.trim() || element.getAttribute('data-language');
        }
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
