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

// Get logged-in username
function getUsername() {
    // Try reading from GFG localStorage
    try {
        const profileData = localStorage.getItem("gfgProfile");
        if (profileData) {
            const parsed = JSON.parse(profileData);
            if (parsed && parsed.data && parsed.data.user_name) {
                return parsed.data.user_name;
            }
        }
    } catch (e) {}

    // Try from DOM
    const domUser = document.querySelector('a[title="Profile"] span, .profile_name, .header_user_name');
    if (domUser && domUser.textContent.trim()) {
        return domUser.textContent.trim();
    }

    return "anonymous";
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
        // Send message to background script
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
        // Check added nodes
        if (mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) { // Element node
                    // Check for success message in the node or its children
                    if (node.textContent && node.textContent.includes("Problem Solved Successfully")) {
                        console.log("✅ GFG success detected in added node");
                        handleSuccessfulSubmission();
                        return;
                    }
                    
                    // Check for success toast notifications
                    const successToast = node.querySelector('.toast-success, .problemSuccessToast');
                    if (successToast) {
                        console.log("✅ GFG success detected in toast");
                        handleSuccessfulSubmission();
                        return;
                    }
                }
            }
        }
        
        // Also check for attribute changes that might indicate success
        if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
            const target = mutation.target;
            if (target.classList && (target.classList.contains('problemSuccessToast') || 
                target.classList.contains('toast-success'))) {
                console.log("✅ GFG success detected via attribute change");
                handleSuccessfulSubmission();
                return;
            }
        }
    }
}

// Handle successful submission
async function handleSuccessfulSubmission() {
    const slug = getSlug();
    if (!slug) return;

    // Check for duplicate submissions
    const now = Date.now();
    if (submissionInProgress || (lastSentSlug === slug && now - lastSentTime < SEND_COOLDOWN_MS)) {
        console.log("⏩ Duplicate submission ignored");
        return;
    }

    // Mark submission as in progress
    submissionInProgress = true;
    lastSentSlug = slug;
    lastSentTime = now;

    try {
        const username = getUsername();
        const email = await getEmail();
        const attempts = incrementAttempts(slug);

        // Get problem title
        const titleElement = document.querySelector('.problem-tab h2, .problems_header_content h3, .problem-statement h2');
        const title = titleElement ? titleElement.textContent.trim() : "Unknown Problem";

        const payload = {
            platform: "gfg",
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
        // Reset submission flag after a delay
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
        console.log("🔄 URL changed, reset tracking state");
    }
}, 1000);

console.log("👀 GFG submission tracker is running...");
