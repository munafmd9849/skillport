// Admin Dashboard JavaScript

// Base URL for API calls
const API_BASE_URL = '/api';

// DOM Elements
let statsElements = {};
let systemStatusElements = {};
let recentActivityElement;
let recentUsersElement;
let recentMentorsElement;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    initializeElements();
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up event listeners
    setupEventListeners();
});

// Initialize DOM elements
function initializeElements() {
    // Stats cards
    statsElements = {
        totalUsers: document.querySelector('.stats-total-users'),
        totalMentors: document.querySelector('.stats-total-mentors'),
        totalContests: document.querySelector('.stats-total-contests'),
        totalProblemsSolved: document.querySelector('.stats-total-problems')
    };
    
    // System status elements
    systemStatusElements = {
        systemStatus: document.querySelector('.system-status'),
        serverLoad: document.querySelector('.server-load'),
        database: document.querySelector('.database-usage'),
        uptime: document.querySelector('.system-uptime')
    };
    
    // Recent activity and users/mentors lists
    recentActivityElement = document.querySelector('.recent-activity-list');
    recentUsersElement = document.querySelector('.recent-users-list');
    recentMentorsElement = document.querySelector('.recent-mentors-list');
}

// Set up event listeners
function setupEventListeners() {
    // Quick action buttons
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', function(e) {
            const actionType = this.dataset.action;
            handleQuickAction(actionType);
        });
    });
}

// Load dashboard data from API
async function loadDashboardData() {
    try {
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
        
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            // For development purposes, continue with mock data
            loadMockData();
            return;
        }
        
        // Update system status elements while loading
        updateSystemStatus('Loading...', 'text-amber-600');
        
        // Fetch dashboard overview data
        const response = await fetch(`${API_BASE_URL}/dashboard/overview`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication error:', response.status);
                window.location.href = '../../../index.html';
                return;
            }
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Fetch system status data
        const systemResponse = await fetch(`${API_BASE_URL}/dashboard/system-status`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (systemResponse.ok) {
            const systemData = await systemResponse.json();
            // Add system data to the dashboard data
            data.system = systemData;
        } else {
            console.error('Error fetching system status:', systemResponse.status);
        }
        
        updateDashboard(data.overview || data);
        
        // Update system status based on fetched data
        if (data.system && data.system.systemStatus) {
            const status = data.system.systemStatus;
            let colorClass = 'text-green-600';
            
            if (status === 'Degraded') {
                colorClass = 'text-amber-600';
            } else if (status === 'Outage') {
                colorClass = 'text-red-600';
            }
            
            updateSystemStatus(status, colorClass);
        } else {
            updateSystemStatus('Operational', 'text-green-600');
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // For demo purposes, load mock data if API fails
        loadMockData();
        updateSystemStatus('Degraded', 'text-amber-600');
    }
}

// Update system status display
function updateSystemStatus(status, colorClass) {
    if (systemStatusElements.systemStatus) {
        systemStatusElements.systemStatus.textContent = status;
        
        // Remove existing color classes
        systemStatusElements.systemStatus.classList.remove('text-green-600', 'text-amber-600', 'text-red-600');
        
        // Add new color class
        if (colorClass) {
            systemStatusElements.systemStatus.classList.add(colorClass);
        }
    }
}

// Update dashboard with data
function updateDashboard(data) {
    // Update stats cards
    if (statsElements.totalUsers) {
        statsElements.totalUsers.textContent = data.totalUsers || '247';
    }
    if (statsElements.totalMentors) {
        statsElements.totalMentors.textContent = data.totalMentors || '18';
    }
    if (statsElements.totalContests) {
        statsElements.totalContests.textContent = data.totalBatches || '25';
    }
    if (statsElements.totalProblemsSolved) {
        const overallStats = data.overallStats || {};
        statsElements.totalProblemsSolved.textContent = overallStats.totalSubmissions || '1,847';
    }
    
    // Update system overview if available
    if (data.system) {
        updateSystemOverview(data.system);
    }
    
    // Update recent batches/contests if available
    if (data.recentBatches && recentActivityElement) {
        updateRecentActivity(data.recentBatches);
    } else if (data.recentActivity && recentActivityElement) {
        updateRecentActivity(data.recentActivity);
    }
    
    // Update recent users if available
    if (data.recentUsers && recentUsersElement) {
        updateRecentUsers(data.recentUsers);
    }
    
    // Update recent mentors if available
    if (data.recentMentors && recentMentorsElement) {
        updateRecentMentors(data.recentMentors);
    }
}

// Update system overview section
function updateSystemOverview(system) {
    if (!system) return;
    
    // Update system status
    if (systemStatusElements.systemStatus) {
        // Use systemStatus for the API response or status for mock data
        const status = system.systemStatus || system.status || 'Operational';
        systemStatusElements.systemStatus.textContent = status;
        
        // Add color based on status
        systemStatusElements.systemStatus.classList.remove('text-green-600', 'text-amber-600', 'text-red-600');
        
        if (status === 'Operational') {
            systemStatusElements.systemStatus.classList.add('text-green-600');
        } else if (status === 'Degraded') {
            systemStatusElements.systemStatus.classList.add('text-amber-600');
        } else if (status === 'Outage') {
            systemStatusElements.systemStatus.classList.add('text-red-600');
        }
    }
    
    // Update server load
    if (systemStatusElements.serverLoad) {
        systemStatusElements.serverLoad.textContent = system.serverLoad || '42%';
    }
    
    // Update database usage
    if (systemStatusElements.database) {
        systemStatusElements.database.textContent = system.databaseUsage || '38%';
    }
    
    // Update system uptime
    if (systemStatusElements.uptime) {
        systemStatusElements.uptime.textContent = system.uptime || '24 days';
    }
}

// Update recent activity list
function updateRecentActivity(activities) {
    if (!recentActivityElement) return;
    
    recentActivityElement.innerHTML = '';
    
    activities.slice(0, 4).forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'flex items-start gap-3';
        
        // Determine icon based on activity type
        let iconClass = 'trophy';
        let bgColorClass = 'bg-blue-100';
        let textColorClass = 'text-blue-600';
        
        if (activity.type === 'user') {
            iconClass = 'user-plus';
            bgColorClass = 'bg-green-100';
            textColorClass = 'text-green-600';
        } else if (activity.type === 'mentor') {
            iconClass = 'graduation-cap';
            bgColorClass = 'bg-purple-100';
            textColorClass = 'text-purple-600';
        }
        
        activityItem.innerHTML = `
            <div class="w-8 h-8 ${bgColorClass} rounded-full flex items-center justify-center">
                <i data-lucide="${iconClass}" class="w-4 h-4 ${textColorClass}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-slate-900">${activity.title || 'New batch created'}</p>
                <p class="text-xs text-slate-500">${activity.description || 'Created by admin'} ${activity.timeAgo || '4 hours ago'}</p>
            </div>
        `;
        
        recentActivityElement.appendChild(activityItem);
    });
    
    // Initialize Lucide icons for the new elements
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Update recent users list
function updateRecentUsers(users) {
    if (!recentUsersElement) return;
    
    recentUsersElement.innerHTML = '';
    
    users.slice(0, 3).forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg';
        
        // Generate random gradient for avatar
        const gradients = [
            'from-blue-400 to-indigo-500',
            'from-green-400 to-emerald-500',
            'from-purple-400 to-pink-500',
            'from-amber-400 to-orange-500'
        ];
        const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
        
        userItem.innerHTML = `
            <div class="w-8 h-8 bg-gradient-to-br ${randomGradient} rounded-full flex items-center justify-center text-white text-sm font-semibold">
                ${user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-slate-900">${user.name || 'User Name'}</p>
                <p class="text-xs text-slate-500">${user.email || 'user@example.com'}</p>
            </div>
            <span class="text-xs text-green-600">${user.timeAgo || '2 hours ago'}</span>
        `;
        
        recentUsersElement.appendChild(userItem);
    });
}

// Update recent mentors list
function updateRecentMentors(mentors) {
    if (!recentMentorsElement) return;
    
    recentMentorsElement.innerHTML = '';
    
    mentors.slice(0, 3).forEach(mentor => {
        const mentorItem = document.createElement('div');
        mentorItem.className = 'flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg';
        
        // Generate random gradient for avatar
        const gradients = [
            'from-amber-400 to-orange-500',
            'from-blue-400 to-cyan-500',
            'from-green-400 to-teal-500',
            'from-purple-400 to-pink-500'
        ];
        const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
        
        mentorItem.innerHTML = `
            <div class="w-8 h-8 bg-gradient-to-br ${randomGradient} rounded-full flex items-center justify-center text-white text-sm font-semibold">
                ${mentor.name ? mentor.name.charAt(0) : 'M'}
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-slate-900">${mentor.name || 'Mentor Name'}</p>
                <p class="text-xs text-slate-500">${mentor.specialty || 'DSA Expert'} • ${mentor.studentCount || '0'} students</p>
            </div>
            <span class="text-xs text-green-600">Active</span>
        `;
        
        recentMentorsElement.appendChild(mentorItem);
    });
}

// Handle quick actions
function handleQuickAction(actionType) {
    switch(actionType) {
        case 'add-user':
            window.location.href = 'admin-users.html?action=add';
            break;
        case 'add-mentor':
            window.location.href = 'admin-mentors.html?action=add';
            break;
        case 'create-contest':
            window.location.href = 'admin-contests.html?action=add';
            break;
        case 'view-analytics':
            window.location.href = 'admin-analytics.html';
            break;
        case 'view-leaderboard':
            window.location.href = 'admin-leaderboard.html';
            break;
        default:
            console.log('Unknown action:', actionType);
    }
}

// Load mock data for demo purposes
function loadMockData() {
    const mockData = {
        totalUsers: 247,
        totalMentors: 18,
        totalBatches: 25,
        overallStats: {
            totalSubmissions: 1847,
            solved: 1542,
            reattempts: 245,
            doubts: 60,
            easy: 723,
            medium: 894,
            hard: 230
        },
        system: {
            status: 'Operational',
            serverLoad: '42%',
            databaseUsage: '38%',
            uptime: '24 days'
        },
        recentActivity: [
            {
                type: 'contest',
                title: 'New contest created',
                description: 'DSA Contest #6 by Dr. Smith',
                timeAgo: '4 hours ago'
            },
            {
                type: 'mentor',
                title: 'Mentor assigned',
                description: 'Dr. Johnson assigned to Java Contest',
                timeAgo: '6 hours ago'
            },
            {
                type: 'user',
                title: 'New user registered',
                description: 'Rahul Kumar joined',
                timeAgo: '2 hours ago'
            },
            {
                type: 'contest',
                title: 'Contest completed',
                description: 'Python Contest #3 ended with 45 participants',
                timeAgo: '1 day ago'
            }
        ],
        recentBatches: [
            {
                title: 'New contest created',
                description: 'DSA Contest #6 by Dr. Smith',
                timeAgo: '4 hours ago',
                type: 'contest'
            },
            {
                title: 'Mentor assigned',
                description: 'Dr. Johnson assigned to Java Contest',
                timeAgo: '6 hours ago',
                type: 'mentor'
            },
            {
                title: 'New user registered',
                description: 'Rahul Kumar joined',
                timeAgo: '2 hours ago',
                type: 'user'
            },
            {
                title: 'Contest completed',
                description: 'Python Contest #3 ended with 45 participants',
                timeAgo: '1 day ago',
                type: 'contest'
            }
        ],
        recentUsers: [
            {
                name: 'Rahul Kumar',
                email: 'rahul.kumar@email.com',
                timeAgo: '2 hours ago',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
            },
            {
                name: 'Priya Sharma',
                email: 'priya.sharma@email.com',
                timeAgo: '1 day ago',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
            },
            {
                name: 'Amit Patel',
                email: 'amit.patel@email.com',
                timeAgo: '2 days ago',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
            }
        ],
        recentMentors: [
            {
                name: 'Dr. Smith',
                specialty: 'DSA Expert',
                studentCount: 24,
                email: 'smith@example.com',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString() // 1 week ago
            },
            {
                name: 'Dr. Johnson',
                specialty: 'Java Expert',
                studentCount: 18,
                email: 'johnson@example.com',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString() // 2 weeks ago
            },
            {
                name: 'Prof. Wilson',
                specialty: 'Python Expert',
                studentCount: 15,
                email: 'wilson@example.com',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString() // 3 weeks ago
            }
        ]
    };
    
    updateDashboard(mockData);
}