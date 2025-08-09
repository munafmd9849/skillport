/**
 * Test script for SkillPort API endpoints
 * 
 * This script tests the following endpoints:
 * 1. User registration
 * 2. User login
 * 3. Single submission creation
 * 4. Extension submission creation
 * 5. Bulk submission creation
 * 6. Submission retrieval
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123',
  role: 'student'
};

// Store auth token
let authToken = '';

// Test submissions
const singleSubmission = {
  platform: 'leetcode',
  url: 'https://leetcode.com/problems/merge-two-sorted-lists',
  slug: 'merge-two-sorted-lists',
  username: 'testuser',
  attempts: 1
};

const extensionSubmission = {
  email: 'testuser@example.com',
  platform: 'leetcode',
  url: 'https://leetcode.com/problems/palindrome-number',
  slug: 'palindrome-number',
  username: 'testuser',
  attempts: 1
};

const bulkSubmissions = [
  {
    username: 'testuser',
    platform: 'leetcode',
    url: 'https://leetcode.com/problems/roman-to-integer',
    slug: 'roman-to-integer',
    timestamp: new Date().toISOString(),
    attempts: 1
  },
  {
    username: 'testuser',
    platform: 'leetcode',
    url: 'https://leetcode.com/problems/longest-common-prefix',
    slug: 'longest-common-prefix',
    timestamp: new Date().toISOString(),
    attempts: 2
  }
];

// Helper function to log results
const logResult = (testName, success, data = null, error = null) => {
  console.log(`\n----- ${testName} -----`);
  if (success) {
    console.log('✅ SUCCESS');
    if (data) console.log('Response:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ FAILED');
    if (error) {
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }
  }
};

// Test functions
async function registerUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, TEST_USER);
    logResult('User Registration', true, response.data);
    return true;
  } catch (error) {
    // If user already exists, that's okay
    if (error.response && error.response.data && error.response.data.error && error.response.data.error.includes('already exists')) {
      logResult('User Registration', true, { message: 'User already exists, continuing with tests' });
      return true;
    }
    logResult('User Registration', false, null, error);
    return false;
  }
}

async function loginUser() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    authToken = response.data.token;
    logResult('User Login', true, { message: 'Login successful', token: 'Token received' });
    return true;
  } catch (error) {
    logResult('User Login', false, null, error);
    return false;
  }
}

async function createSingleSubmission() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/submissions`,
      { ...singleSubmission, email: TEST_USER.email },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult('Create Single Submission', true, response.data);
    return true;
  } catch (error) {
    logResult('Create Single Submission', false, null, error);
    return false;
  }
}

async function createExtensionSubmission() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/submissions/extension`,
      extensionSubmission
    );
    logResult('Create Extension Submission', true, response.data);
    return true;
  } catch (error) {
    logResult('Create Extension Submission', false, null, error);
    return false;
  }
}

async function createBulkSubmissions() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/submissions/bulk`,
      { submissions: bulkSubmissions.map(sub => ({ ...sub, email: TEST_USER.email })) },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult('Create Bulk Submissions', true, response.data);
    return true;
  } catch (error) {
    logResult('Create Bulk Submissions', false, null, error);
    return false;
  }
}

async function getSubmissions() {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/submissions`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    logResult('Get Submissions', true, {
      message: 'Retrieved submissions successfully',
      count: response.data.totalSubmissions,
      firstSubmission: response.data.submissions[0]
    });
    return true;
  } catch (error) {
    logResult('Get Submissions', false, null, error);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting SkillPort API Tests');
  console.log('==============================');
  
  // Register and login
  const registered = await registerUser();
  if (!registered) {
    console.log('\n❌ Tests aborted: Failed to register user');
    return;
  }
  
  const loggedIn = await loginUser();
  if (!loggedIn) {
    console.log('\n❌ Tests aborted: Failed to login');
    return;
  }
  
  // Test submissions
  await createSingleSubmission();
  await createExtensionSubmission();
  await createBulkSubmissions();
  await getSubmissions();
  
  console.log('\n==============================');
  console.log('🏁 All tests completed');
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error during tests:', error);
});