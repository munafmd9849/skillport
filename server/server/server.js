const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../../client')));

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const batchRoutes = require('./routes/batches');
const submissionRoutes = require('./routes/submissions');
const taskRoutes = require('./routes/tasks');
const communityRoutes = require('./routes/communities');
const contestRoutes = require('./routes/contests');
const leaderboardRoutes = require('./routes/leaderboards');

// Mount routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/leaderboards', leaderboardRoutes);

// Health check
app.get('/api', (req, res) => {
  res.send('SkillPort API is running');
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// Connect to MongoDB and start server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillport';

console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️  Starting server without MongoDB for testing...');
  console.log('📝 Some features may not work without database connection');
  
  // Start server without MongoDB for testing
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (No MongoDB)`);
    console.log('🔗 Health check: http://localhost:5000/');
    console.log('📥 Extension endpoint: http://localhost:5000/api/submissions');
  });
});
