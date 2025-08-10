console.log("📡 SkillPort GFG Tracker Active");

// Observer configuration - watch for DOM changes and attribute changes
const OBSERVER_CONFIG = { 
    childList: true, 
    subtree: true, 
    attributes: true, 
    attributeFilter: ['class', 'style', 'data-status'] 
};

// Submission tracking variables
let lastSentSlug = null;
let lastSentTime = 0;
let submissionInProgress = false;
const SEND_COOLDOWN_MS = 5000;

// Utility: Wait helper
const wait = (ms) => new Promise(res => setTimeout(res, ms));

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Get problem slug from URL
function getSlug() {
    const match = location.pathname.match(/\/problems\/([^\/]+)\//);
    return match ? match[1] : null;
}

// Get problem URL
function getProblemURL() {
    return location.href;
}

/**
 * Extract username from available sources:
 * - localStorage gfgProfile
 * - profile link
 * - DOM visible username
 */
function extractUsername() {
    try {
        const profileData = localStorage.getItem("gfgProfile");
        if (profileData) {
            const parsed = JSON.parse(profileData);
            if (parsed?.data?.user_name) {
                return parsed.data.user_name.trim();
            }
        }
    } catch (e) {}

    const profileLink = document.querySelector('a[href^="https://www.geeksforgeeks.org/user/"]');
    if (profileLink?.href) {
        const match = profileLink.href.match(/user\/([^/]+)/);
        if (match?.[1]) {
            return match[1].trim();
        }
    }

    const domUser = document.querySelector('a[title="Profile"] span, .profile_name, .header_user_name');
    if (domUser?.textContent.trim()) {
        return domUser.textContent.trim();
    }

    return null;
}

// Cached username stored in localStorage for persistence
let cachedUsername = localStorage.getItem("skillport-username") || "anonymous";

/**
 * Update cached username if a better one is found.
 * Returns true if username updated, else false.
 */
function updateCachedUsername() {
    const found = extractUsername();
    if (found && found !== "anonymous" && found !== cachedUsername) {
        cachedUsername = found;
        localStorage.setItem("skillport-username", found);
        console.log("✅ Username detected and cached:", found);
        return true;
    }
    return false;
}

// Initial attempt to update cached username at script start
updateCachedUsername();

// Always return cached username
function getUsername() {
    // Also try to update cached username whenever called
    updateCachedUsername();
    return cachedUsername;
}

// Count attempts for this problem
function incrementAttempts(slug) {
    let submissions = JSON.parse(localStorage.getItem("skillport-submissions") || "{}");
    if (!submissions[slug]) submissions[slug] = { attempts: 0 };
    submissions[slug].attempts += 1;
    localStorage.setItem("skillport-submissions", JSON.stringify(submissions));
    return submissions[slug].attempts;
}

// Get email from storage
async function getEmail() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(["email"], (result) => {
            resolve(result.email || "anonymous@gmail.com");
        });
    });
}

// Send data to background script
async function sendSubmission(data) {
    try {
        chrome.runtime.sendMessage({ type: "submitData", data }, (response) => {
            if (!response || !response.success) {
                console.error("❌ Failed to send GFG submission:", response);
            } else {
                console.log("✅ GFG submission sent successfully:", response);
            }
        });
    } catch (err) {
        console.error("❌ Failed to send submission:", err);
    }
}

// Check if submission is successful
function detectSuccess(mutations) {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // Element node
                    if (node.textContent && node.textContent.includes("Problem Solved Successfully")) {
                        handleSuccessfulSubmission();
                        return;
                    }
                    const successToast = node.querySelector('.toast-success, .problemSuccessToast');
                    if (successToast) {
                        handleSuccessfulSubmission();
                        return;
                    }
                }
            }
        }

        if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
            const target = mutation.target;
            if (target.classList && (target.classList.contains('problemSuccessToast') || 
                target.classList.contains('toast-success'))) {
                handleSuccessfulSubmission();
                return;
            }
        }
    }
}

// Handle successful submission - updated with username cache & fetch logic
async function handleSuccessfulSubmission() {
    const slug = getSlug();
    if (!slug) return;

    const now = Date.now();
    if (submissionInProgress || (lastSentSlug === slug && now - lastSentTime < SEND_COOLDOWN_MS)) {
        return; // silently ignore duplicate submissions
    }

    submissionInProgress = true;
    lastSentSlug = slug;
    lastSentTime = now;

    try {
        // Step 1: Use cached username first
        let username = cachedUsername;

        // Step 2: If cached username is anonymous, try extracting fresh username now
        if (username === "anonymous") {
            const extracted = extractUsername();
            if (extracted && extracted !== "anonymous") {
                username = extracted;
                cachedUsername = username;
                localStorage.setItem("skillport-username", username);
                console.log("🔄 Username updated just before submission:", username);
            }
        }

        // Step 3: If still anonymous fallback explicitly
        if (!username || username === "anonymous") {
            username = "anonymous";
        }

        const email = await getEmail();
        const attempts = incrementAttempts(slug);

        const titleElement = document.querySelector('.problem-tab h2, .problems_header_content h3, .problem-statement h2');
        const title = titleElement ? titleElement.textContent.trim() : "Unknown Problem";

        const payload = {
            platform: "geeksforgeeks",
            slug,
            url: getProblemURL(),
            username,
            email,
            attempts,
            title,
            timestamp: new Date().toISOString(),
        };

        console.log("📤 Logging GFG submission:", payload);
        await sendSubmission(payload);
    } catch (error) {
        console.error("❌ Error processing GFG submission:", error);
    } finally {
        setTimeout(() => {
            submissionInProgress = false;
        }, SEND_COOLDOWN_MS);
    }
}

// Create a debounced version of detectSuccess
const debouncedDetectSuccess = debounce(detectSuccess, 300);

// Start observer with debounced handler
const observer = new MutationObserver(debouncedDetectSuccess);
observer.observe(document.body, OBSERVER_CONFIG);

// Reset tracking when URL changes (user navigates to a different problem)
let lastUrl = location.href;
setInterval(() => {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        submissionInProgress = false;
        lastSentTime = 0;
        // No log here to keep console clean
    }
}, 1000);

console.log("👀 GFG submission tracker is running...");
