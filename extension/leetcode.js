console.log("📡 SkillPort LeetCode Tracker Active");

const BACKEND_URL = "http://localhost:3001/api/submissions"; // Change if hosted
let lastLoggedSlug = null;
let attempts = 0;

function getSlug() {
  const match = location.pathname.match(/\/problems\/([^\/]+)/);
  return match ? match[1] : null;
}

function isAcceptedSubmission() {
  const verdictEl = document.querySelector('span[data-e2e-locator="submission-result"]');
  return verdictEl && verdictEl.textContent.trim() === "Accepted";
}

async function getEmail() {
  return new Promise((res) => {
    chrome.storage.sync.get(["email"], (result) => {
      res(result.email || "anonymous@gmail.com");
    });
  });
}

function getUsername() {
  const userMenu = document.querySelector('a[href^="/u/"]');
  if (userMenu) {
    const match = userMenu.getAttribute("href").match(/\/u\/([^\/]+)/);
    if (match) return match[1];
  }

  const avatar = document.querySelector('img[alt*="\'s avatar"]');
  if (avatar && avatar.alt) {
    return avatar.alt.replace(/'s avatar.*/, "").trim();
  }

  const dropdown = document.querySelector('[data-cy="header-user-menu"] span');
  return dropdown?.textContent?.trim() || "anonymous";
}

async function logSubmission() {
  const slug = getSlug();
  if (!slug || slug === lastLoggedSlug || !isAcceptedSubmission()) return;

  const email = await getEmail();
  const username = getUsername();
  const timestamp = new Date().toISOString();

  const data = {
    username,
    email,
    url: location.href,
    slug,
    timestamp,
    platform: "leetcode",
    attempts: ++attempts,
  };

  console.log("✅ Logging Accepted Submission:", data);
  lastLoggedSlug = slug;

  chrome.runtime.sendMessage({ type: "submitData", data }, (response) => {
    if (!response?.success) {
      console.error("❌ Submission failed:", response);
    }
  });
}

// Mutation Observer Setup
const observer = new MutationObserver(() => {
  if (isAcceptedSubmission()) {
    setTimeout(logSubmission, 500); // Give time for DOM to settle
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
  }
}, 1000);
