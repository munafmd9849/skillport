// Admin Users Management JavaScript

// Base URL for API calls
const API_BASE_URL = '/api';

// DOM Elements
let userStatsElements = {};
let userTableBody;
let searchInput;
let statusFilter;
let contestFilter;
let sortBySelect;
let currentUsers = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    initializeElements();
    
    // Check authentication
    checkAuthentication();
    
    // Load users data
    loadUsersData();
    
    // Set up event listeners
    setupEventListeners();
});

// Initialize DOM elements
function initializeElements() {
    // Stats cards
    userStatsElements = {
        totalUsers: document.querySelector('.stats-total-users'),
        activeUsers: document.querySelector('.stats-active-users'),
        inactiveUsers: document.querySelector('.stats-inactive-users'),
        newUsers: document.querySelector('.stats-new-users')
    };
    
    // Table and filters
    userTableBody = document.querySelector('table tbody');
    searchInput = document.querySelector('input[placeholder="Search users..."]');
    statusFilter = document.querySelector('select:nth-of-type(2)');
    contestFilter = document.querySelector('select:nth-of-type(1)');
    sortBySelect = document.querySelector('select:nth-of-type(3)');
    
    // Form elements
    addUserForm = document.getElementById('addUserForm');
}

// Check if user is authenticated and has admin role
function checkAuthentication() {
    // Check if user is authenticated and has admin role
    if (typeof isLoggedIn === 'function' && typeof getCurrentUser === 'function') {
        if (!isLoggedIn()) {
            console.error('User not logged in');
            window.location.href = '../../../index.html';
            return;
        }
        
        const currentUser = getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            console.error('User not authorized as admin');
            window.location.href = '../../../index.html';
            return;
        }
    }
}

// Set up event listeners
function setupEventListeners() {
    // Search input
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterUsers();
        });
    }
    
    // Status filter
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterUsers();
        });
    }
    
    // Contest filter
    if (contestFilter) {
        contestFilter.addEventListener('change', function() {
            filterUsers();
        });
    }
    
    // Sort by select
    if (sortBySelect) {
        sortBySelect.addEventListener('change', function() {
            sortUsers(this.value);
        });
    }
    
    // Add user form
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createUser();
        });
    }
}

// Load users data from API
async function loadUsersData() {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            // For development purposes, continue with mock data
            loadMockData();
            return;
        }
        
        // Fetch users data
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const users = await response.json();
        currentUsers = users;
        
        // Update UI with users data
        updateUserStats(users);
        renderUsersTable(users);
        
    } catch (error) {
        console.error('Error loading users data:', error);
        // Fall back to mock data for development
        loadMockData();
    }
}

// Load mock data for development
function loadMockData() {
    console.log('Loading mock data for development');
    
    const mockUsers = [
        {
            _id: 'user1',
            name: 'Rahul Kumar',
            username: 'rahulkumar',
            email: 'rahul.kumar@email.com',
            role: 'student',
            status: 'active',
            assignedBatches: [{ _id: 'batch1', name: 'DSA Contest #1' }],
            performance: 847,
            performanceChange: 23,
            createdAt: '2024-12-15T00:00:00.000Z'
        },
        {
            _id: 'user2',
            name: 'Priya Sharma',
            username: 'priyasharma',
            email: 'priya.sharma@email.com',
            role: 'student',
            status: 'active',
            assignedBatches: [{ _id: 'batch2', name: 'Python Contest #1' }],
            performance: 823,
            performanceChange: 15,
            createdAt: '2024-12-10T00:00:00.000Z'
        },
        {
            _id: 'user3',
            name: 'Amit Patel',
            username: 'amitpatel',
            email: 'amit.patel@email.com',
            role: 'student',
            status: 'pending',
            assignedBatches: [],
            performance: 798,
            performanceChange: 8,
            createdAt: '2024-12-08T00:00:00.000Z'
        }
    ];
    
    currentUsers = mockUsers;
    updateUserStats(mockUsers);
    renderUsersTable(mockUsers);
}

// Update user statistics
function updateUserStats(users) {
    if (!userStatsElements.totalUsers) return;
    
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'active').length;
    const inactiveUsers = users.filter(user => user.status === 'inactive').length;
    const newUsers = users.filter(user => {
        const createdDate = new Date(user.createdAt);
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return createdDate >= oneWeekAgo;
    }).length;
    
    userStatsElements.totalUsers.textContent = totalUsers;
    userStatsElements.activeUsers.textContent = activeUsers;
    userStatsElements.inactiveUsers.textContent = inactiveUsers;
    userStatsElements.newUsers.textContent = newUsers;
}

// Render users table
function renderUsersTable(users) {
    if (!userTableBody) return;
    
    userTableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-slate-50';
        
        // Generate initials and random gradient for avatar
        const initials = user.name ? user.name.charAt(0) : 'U';
        const gradients = [
            'from-amber-400 to-orange-500',
            'from-blue-400 to-indigo-500',
            'from-green-400 to-emerald-500',
            'from-purple-400 to-pink-500'
        ];
        const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
        
        // Format date
        const createdDate = new Date(user.createdAt);
        const formattedDate = createdDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        // Determine batch/contest info
        let batchInfo = '<span class="text-sm text-slate-500">No Contest</span>';
        if (user.assignedBatches && user.assignedBatches.length > 0) {
            const batch = user.assignedBatches[0];
            const batchInitial = batch.name ? batch.name.charAt(0) : 'B';
            batchInfo = `
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">
                        ${batchInitial}
                    </div>
                    <span class="text-sm text-slate-900">${batch.name}</span>
                </div>
            `;
        }
        
        // Determine status badge
        let statusBadge = '';
        switch(user.status) {
            case 'active':
                statusBadge = '<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Active</span>';
                break;
            case 'inactive':
                statusBadge = '<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Inactive</span>';
                break;
            case 'pending':
                statusBadge = '<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Pending</span>';
                break;
            default:
                statusBadge = '<span class="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">Unknown</span>';
        }
        
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-br ${randomGradient} rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        ${initials}
                    </div>
                    <div>
                        <div class="text-sm font-medium text-slate-900">${user.name || 'Unknown User'}</div>
                        <div class="text-sm text-slate-500">@${user.username || 'username'}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-900">${user.email || 'email@example.com'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${batchInfo}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-semibold text-slate-900">${user.performance || 0} pts</div>
                <div class="text-xs text-green-600">+${user.performanceChange || 0} this week</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-slate-900">${formattedDate}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex gap-2">
                    <button onclick="editUser('${user._id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onclick="viewUserProfile('${user._id}')" class="text-green-600 hover:text-green-900">View</button>
                    <button onclick="deleteUser('${user._id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </div>
            </td>
        `;
        
        userTableBody.appendChild(row);
    });
}

// Filter users based on search input and filters
function filterUsers() {
    if (!currentUsers || !currentUsers.length) return;
    
    let filteredUsers = [...currentUsers];
    
    // Apply search filter
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
            user.name?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.username?.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply status filter
    if (statusFilter && statusFilter.value !== 'All Status') {
        const status = statusFilter.value.toLowerCase();
        filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    
    // Apply contest filter
    if (contestFilter && contestFilter.value !== 'All Contests') {
        if (contestFilter.value === 'Unassigned') {
            filteredUsers = filteredUsers.filter(user => 
                !user.assignedBatches || user.assignedBatches.length === 0
            );
        } else {
            filteredUsers = filteredUsers.filter(user => 
                user.assignedBatches && 
                user.assignedBatches.some(batch => batch.name === contestFilter.value)
            );
        }
    }
    
    // Apply current sort
    if (sortBySelect) {
        sortUsers(sortBySelect.value, filteredUsers);
    } else {
        renderUsersTable(filteredUsers);
    }
}

// Sort users based on selected criteria
function sortUsers(criteria, users = null) {
    const usersToSort = users || [...currentUsers];
    
    switch(criteria) {
        case 'Name':
            usersToSort.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'Join Date':
            usersToSort.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'Performance':
            usersToSort.sort((a, b) => (b.performance || 0) - (a.performance || 0));
            break;
        case 'Contest':
            usersToSort.sort((a, b) => {
                const aContest = a.assignedBatches && a.assignedBatches.length > 0 ? a.assignedBatches[0].name : '';
                const bContest = b.assignedBatches && b.assignedBatches.length > 0 ? b.assignedBatches[0].name : '';
                return aContest.localeCompare(bContest);
            });
            break;
    }
    
    renderUsersTable(usersToSort);
}

// Create a new user
async function createUser() {
    try {
        const form = document.getElementById('addUserForm');
        const formData = new FormData(form);
        
        // Extract form values
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const contest = formData.get('contest');
        const notes = formData.get('notes');
        
        // Validate form
        if (!firstName || !lastName || !email || !username || !password) {
            alert('Please fill in all required fields');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            alert('Authentication error. Please log in again.');
            return;
        }
        
        // Prepare user data
        const userData = {
            name: `${firstName} ${lastName}`,
            email,
            username,
            password,
            role: 'student' // Default role for new users
        };
        
        // Send API request
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const newUser = await response.json();
        
        // If contest is selected, assign user to batch
        if (contest) {
            // This would require an additional API call to assign the user to a batch
            // For now, we'll just show a success message
        }
        
        alert('User created successfully!');
        closeAddUserModal();
        
        // Reload users data
        loadUsersData();
        
    } catch (error) {
        console.error('Error creating user:', error);
        alert(`Error creating user: ${error.message}`);
    }
}

// Edit user
async function editUser(userId) {
    try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            alert('Authentication error. Please log in again.');
            return;
        }
        
        // For now, just show an alert
        // In a real implementation, this would open an edit modal with the user's data
        alert(`Editing user with ID: ${userId}`);
        
    } catch (error) {
        console.error('Error editing user:', error);
        alert(`Error editing user: ${error.message}`);
    }
}

// View user profile
function viewUserProfile(userId) {
    // This would navigate to the user's profile page
    window.open(`student-analytics.html?student=${userId}`, '_blank');
}

// Delete user
async function deleteUser(userId) {
    try {
        // Find user in currentUsers array
        const user = currentUsers.find(u => u._id === userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        // Update the delete confirmation modal
        const userName = user.name || userId;
        document.getElementById('deleteUserName').textContent = userName;
        
        // Store the user ID to delete
        window.userToDelete = userId;
        
        // Show the delete confirmation modal
        document.getElementById('deleteUserModal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
    } catch (error) {
        console.error('Error preparing to delete user:', error);
        alert(`Error: ${error.message}`);
    }
}

// Confirm delete user
async function confirmDeleteUser() {
    try {
        const userId = window.userToDelete;
        if (!userId) {
            throw new Error('No user selected for deletion');
        }
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            alert('Authentication error. Please log in again.');
            return;
        }
        
        // Send API request to delete user
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        alert('User deleted successfully!');
        closeDeleteUserModal();
        
        // Reload users data
        loadUsersData();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(`Error deleting user: ${error.message}`);
        closeDeleteUserModal();
    }
}

// Modal functions
function openAddUserModal() {
    document.getElementById('addUserModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAddUserModal() {
    document.getElementById('addUserModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('addUserForm').reset();
}

function closeDeleteUserModal() {
    document.getElementById('deleteUserModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    window.userToDelete = null;
}