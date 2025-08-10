const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const submissionRoutes = require('./routes/submissions');
const batchRoutes = require('./routes/batches');
const dashboardRoutes = require('./routes/dashboard');
const userRoutes = require('./routes/users');
const taskRoutes = require('./routes/tasks');
const communityRoutes = require('./routes/communities');
const contestRoutes = require('./routes/contests');
const leaderboardRoutes = require('./routes/leaderboards');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://cdn.tailwindcss.com"],
      scriptSrcAttr: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:5000', 'chrome-extension://*', 'file://', 'null'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json());

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/leaderboards', leaderboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SkillPort API is running' });
});

// Test admin endpoint
app.get('/test-admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../test-admin.html'));
});

// Serve admin dashboard files
app.get('/community/admin/:file', (req, res) => {
  const fileName = req.params.file;
  const filePath = path.join(__dirname, '../client/community/admin', fileName);
  res.sendFile(filePath);
});

// Serve auth.js file
app.get('/auth.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/auth.js'));
});

// Serve main index.html file
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Catch-all route for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Connect to MongoDB and start server
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillport';

console.log('Attempting to connect to MongoDB...');

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  app.listen(PORT, () => {
    console.log(`🚀 SkillPort server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('⚠️  Starting server without MongoDB for testing...');
  console.log('📝 Some features may not work without database connection');
  
  // Start server without MongoDB for testing
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (No MongoDB)`);
    console.log('🔗 Health check: http://localhost:5000/api/health');
    console.log('📥 Extension endpoint: http://localhost:5000/api/submissions');
  });
});