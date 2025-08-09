console.log("📡 SkillPort LeetCode Tracker Active");

const BACKEND_URL = "http://localhost:3001/api/submissions"; // Change if hosted
let lastLoggedSlug = null;
let attempts = 0;
let submissionInProgress = false;
let lastSubmissionTime = 0;
const SUBMISSION_COOLDOWN = 5000; // 5 seconds cooldown between submissions

function getSlug() {
  const match = location.pathname.match(/\/problems\/([^\/]+)/);
  return match ? match[1] : null;
}

function isAcceptedSubmission() {
  // Method 1: Check for the submission result span
  const verdictEl = document.querySelector('span[data-e2e-locator="submission-result"]');
  if (verdictEl && verdictEl.textContent.trim() === "Accepted") {
    return true;
  }
  
  // Method 2: Check for the success icon or message
  const successIcon = document.querySelector('.success-icon, .text-success, .text-green');
  if (successIcon && successIcon.closest('.result-container, .submission-result')) {
    return true;
  }
  
  // Method 3: Check for success text in the result container
  const resultContainer = document.querySelector('.result-container, .submission-result');
  if (resultContainer && resultContainer.textContent.includes('Accepted')) {
    return true;
  }
  
  return false;
}

async function getEmail() {
  return new Promise((res) => {
    chrome.storage.sync.get(["email"], (result) => {
      res(result.email || "anonymous@gmail.com");
    });
  });
}

function getUsername() {
  // Method 1: Check for user profile link
  const userMenu = document.querySelector('a[href^="/u/"]');
  if (userMenu) {
    const match = userMenu.getAttribute("href").match(/\/u\/([^\/]+)/);
    if (match) return match[1];
  }

  // Method 2: Check for avatar alt text
  const avatar = document.querySelector('img[alt*="\'s avatar"]');
  if (avatar && avatar.alt) {
    return avatar.alt.replace(/'s avatar.*/, "").trim();
  }

  // Method 3: Check for user dropdown menu
  const dropdown = document.querySelector('[data-cy="header-user-menu"] span, .user-dropdown span');
  if (dropdown && dropdown.textContent) {
    return dropdown.textContent.trim();
  }
  
  // Method 4: Check for username in navbar
  const navbarUsername = document.querySelector('.navbar__username, .username');
  if (navbarUsername && navbarUsername.textContent) {
    return navbarUsername.textContent.trim();
  }

  return "anonymous";
}

async function logSubmission() {
  // Prevent duplicate submissions
  const now = Date.now();
  if (submissionInProgress || now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
    console.log("⏱️ Submission cooldown active or submission in progress, skipping...");
    return;
  }
  
  const slug = getSlug();
  if (!slug || !isAcceptedSubmission()) return;
  
  // Set flags to prevent duplicate submissions
  submissionInProgress = true;
  lastSubmissionTime = now;

  const email = await getEmail();
  const username = getUsername();
  const timestamp = new Date().toISOString();
  
  // Get problem title if available
  let problemTitle = "";
  const titleElement = document.querySelector('.title, .question-title, h4.title');
  if (titleElement) {
    problemTitle = titleElement.textContent.trim();
  }

  const data = {
    username,
    email,
    url: location.href,
    slug,
    timestamp,
    platform: "leetcode",
    attempts: ++attempts,
    problemTitle: problemTitle
  };

  console.log("✅ Logging Accepted Submission:", data);
  lastLoggedSlug = slug;

  chrome.runtime.sendMessage({ type: "submitData", data }, (response) => {
    submissionInProgress = false; // Reset flag after submission attempt
    
    if (!response?.success) {
      console.error("❌ Submission failed:", response);
    } else {
      console.log("✅ Submission successful:", response);
    }
  });
}

// Debounce function to limit how often logSubmission can be called
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Debounced version of logSubmission
const debouncedLogSubmission = debounce(() => {
  if (isAcceptedSubmission()) {
    logSubmission();
  }
}, 1000); // 1 second debounce

// Mutation Observer Setup
const observer = new MutationObserver((mutations) => {
  // Look for changes that might indicate a submission result
  const relevantMutation = mutations.some(mutation => {
    // Check if any added nodes contain submission results
    if (mutation.addedNodes.length) {
      return Array.from(mutation.addedNodes).some(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // More specific targeting of submission result elements
          return (
            (node.classList && (
              node.classList.contains('result') || 
              node.classList.contains('success')
            )) ||
            node.querySelector('.result-container, .submission-result, span[data-e2e-locator="submission-result"]')
          );
        }
        return false;
      });
    }
    // Also check for attribute changes on existing elements
    if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
      return mutation.target.classList && (
        mutation.target.classList.contains('result') ||
        mutation.target.classList.contains('success')
      );
    }
    return false;
  });
  
  // If we found relevant changes, use the debounced function
  if (relevantMutation) {
    debouncedLogSubmission();
  }
});

function startObserver() {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Run observer once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startObserver);
} else {
  startObserver();
}

// Reset tracker on URL change
let lastURL = location.href;
setInterval(() => {
  if (location.href !== lastURL) {
    lastURL = location.href;
    lastLoggedSlug = null;
    attempts = 0;
    submissionInProgress = false;
    lastSubmissionTime = 0;
    console.log("🔄 URL changed, resetting submission tracker");
  }
}, 1000);
