# SkillPort - Coding Practice Tracking Platform

A fullstack web platform that helps students track their coding practice progress on platforms like LeetCode and GeeksforGeeks, while mentors and admins can monitor and analyze the data.

## 🌟 Features

### For Students
- Track coding submissions (Solved, Reattempt, Doubt)
- View personal progress statistics
- Monitor performance across different platforms
- Access to batch-specific resources

### For Mentors
- Monitor student progress in assigned batches
- View aggregated statistics and analytics
- Track performance trends
- Manage batch-specific data

### For Admins
- Create and manage batches
- Assign mentors and students to batches
- View system-wide analytics
- Manage user accounts and permissions

### Browser Extension Support
- Automatic submission detection on LeetCode & GeeksforGeeks
- Sync submissions to the backend
- Real-time progress tracking

## 🏗️ Project Structure

```
skillport/
├── client/                 # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.js
│   └── package.json
├── server/                 # Node.js Backend
│   ├── models/            # MongoDB models
│   │   ├── User.js
│   │   ├── Submission.js
│   │   └── Batch.js
│   ├── routes/            # API routes
│   │   ├── auth.js
│   │   ├── submissions.js
│   │   ├── batches.js
│   │   └── dashboard.js
│   ├── middleware/        # Custom middleware
│   │   └── auth.js
│   ├── server.js          # Main server file
│   └── package.json
├── package.json           # Root package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (>= 16.0.0)
- MongoDB Atlas account
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd skillport
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   # Copy environment example
   cp server/env.example server/.env
   
   # Edit server/.env with your MongoDB Atlas connection string and JWT secret
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 5000) and frontend development server (port 3000).

## 🔧 Configuration

### Environment Variables (server/.env)

```env
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillport?retryWrites=true&w=majority

# JWT Secret Key
JWT_SECRET=your-super-secret-jwt-key-here

# Server Port
PORT=5000

# Node Environment
NODE_ENV=development
```

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  passwordHash: String,
  role: String (enum: ['student', 'mentor', 'admin']),
  batch: ObjectId (ref: 'Batch'),
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Submissions Collection
```javascript
{
  email: String,
  platform: String (enum: ['leetcode', 'geeksforgeeks', 'hackerrank', 'codeforces']),
  problemTitle: String,
  problemUrl: String,
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  status: String (enum: ['solved', 'reattempt', 'doubt', 'in-progress']),
  attempts: Number,
  solution: String,
  language: String,
  timeComplexity: String,
  spaceComplexity: String,
  notes: String,
  tags: [String],
  timestamp: Date,
  lastModified: Date
}
```

### Batches Collection
```javascript
{
  name: String (unique),
  description: String,
  mentors: [ObjectId] (ref: 'User'),
  students: [ObjectId] (ref: 'User'),
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  createdBy: ObjectId (ref: 'User'),
  settings: {
    allowStudentSubmission: Boolean,
    requireMentorApproval: Boolean,
    maxStudents: Number
  }
}
```

## 🔐 Authentication & Authorization

- **JWT-based authentication** with 7-day token expiration
- **Role-based access control** (Student, Mentor, Admin)
- **Password hashing** using bcrypt
- **Protected routes** with middleware

### User Roles & Permissions

| Feature | Student | Mentor | Admin |
|---------|---------|--------|-------|
| View own submissions | ✅ | ✅ | ✅ |
| Create submissions | ✅ | ✅ | ✅ |
| View batch data | ✅ (own batch) | ✅ (assigned batches) | ✅ (all) |
| Manage batches | ❌ | ❌ | ✅ |
| View analytics | ❌ | ✅ (assigned batches) | ✅ (all) |
| Manage users | ❌ | ❌ | ✅ |

## 📡 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Submissions
- `POST /api/submissions` - Create submission
- `GET /api/submissions` - Get user submissions
- `PUT /api/submissions/:id` - Update submission
- `DELETE /api/submissions/:id` - Delete submission
- `GET /api/submissions/stats/user` - Get user statistics

### Batches
- `POST /api/batches` - Create batch (Admin only)
- `GET /api/batches` - Get batches
- `PUT /api/batches/:id` - Update batch (Admin only)
- `DELETE /api/batches/:id` - Delete batch (Admin only)

### Dashboard
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/analytics` - Get analytics (Mentor/Admin)
- `GET /api/dashboard/leaderboard` - Get leaderboard
- `GET /api/dashboard/trends` - Get trends data

## 🛠️ Development

### Available Scripts

```bash
# Root level
npm run dev          # Start both client and server in development
npm run server       # Start only the server
npm run client       # Start only the client
npm run build        # Build the client for production
npm run install-all  # Install dependencies for all packages

# Server only
cd server
npm run dev          # Start server with nodemon
npm start           # Start server in production mode

# Client only
cd client
npm start           # Start React development server
npm run build       # Build for production
```

### Code Style
- ESLint configuration for both client and server
- Prettier for code formatting
- Consistent naming conventions

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect your GitHub repository
4. Deploy using the `heroku-postbuild` script

### Manual Deployment
1. Build the client: `npm run build`
2. Set production environment variables
3. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository. 