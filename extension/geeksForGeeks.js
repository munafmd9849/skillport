console.log("📡 SkillPort GFG Tracker Active");

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const username = "munafmd7407";
const email = "munafmd7407@gmail.com";
const platform = "gfg";

function getSlug() {
  const match = location.href.match(/problems\/([^\/?#]+)/);
  return match ? match[1] : null;
}

function incrementAttempt(slug) {
  const key = "skillport-gfg-submissions";
  const data = JSON.parse(localStorage.getItem(key) || "{}");
  data[slug] = (data[slug] || 0) + 1;
  localStorage.setItem(key, JSON.stringify(data));
  return data[slug];
}

// Add a global flag to avoid repeat logs
let lastCapturedSlug = null;
let lastCapturedTime = 0;

function monitorGFGOutputWindow() {
  console.log("✅ GFG Monitoring Started");

  const observer = new MutationObserver(() => {
    const successH3 = Array.from(document.querySelectorAll("h3")).find(
      (el) => el.textContent.trim() === "Problem Solved Successfully"
    );

    if (!successH3) return;

    const slug = getSlug();
    if (!slug) return;

    const now = Date.now();
    if (lastCapturedSlug === slug && now - lastCapturedTime < 5000) {
      return; // Skip duplicate within 5 seconds
    }

    lastCapturedSlug = slug;
    lastCapturedTime = now;

    const data = {
      username,
      email,
      url: location.href,
      slug,
      timestamp: new Date().toISOString(),
      platform,
      attempts: incrementAttempt(slug),
    };

    console.log("📤 Submission Captured:");
    console.log(JSON.stringify(data, null, 2));
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

(async () => {
  await wait(3000); // Give the page time to fully load
  monitorGFGOutputWindow();
})();
