// Function to submit data to the SkillPort backend
function submitToSkillPort(data) {
  console.log('Preparing to submit data to SkillPort backend:', data);
  
  // Ensure required fields are present
  if (!data.email || !data.platform || !data.timestamp) {
    console.error('Missing required fields: email, platform, and timestamp are required');
    return Promise.reject(new Error('Missing required fields'));
  }

  // Prepare the submission data
  const submissionData = {
    username: data.username,
    email: data.email,
    url: data.url,
    slug: data.slug,
    timestamp: data.timestamp,
    platform: data.platform,
    attempts: data.attempts || 1,
    problemTitle: data.problemTitle,
    language: data.language
  };

  // Send the data to the backend
  return fetch('http://localhost:3001/api/submissions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submissionData),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Submission successful:', data);
    return { success: true, data };
  })
  .catch(error => {
    console.error('Error submitting data:', error);
    return { success: false, error: error.message };
  });
}

// Example usage with the data from the console
const exampleData = {
  attempts: 1,
  email: "munafmd7407@gmail.com",
  platform: "leetcode",
  slug: "count-pairs-whose-sum-is-less-than-target",
  timestamp: "2025-08-08T04:29:41.228Z",
  url: "https://leetcode.com/problems/count-pairs-whose-sum-is-less-than-target/submissions/1727543660/",
  username: "munafmd7407"
};

// Uncomment to test
// submitToSkillPort(exampleData);

// Export the function for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { submitToSkillPort };
}