require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Submission = require('./models/Submission');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/skillport', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Submission endpoint
app.post('/api/submissions', async (req, res) => {
  try {
    const data = req.body;
    
    // Map incoming data to the schema fields
    const submissionData = {
      // Core fields from simplified format
      username: data.username,
      email: data.email,
      url: data.url,
      slug: data.slug,
      timestamp: data.timestamp,
      platform: data.platform,
      attempts: data.attempts,
      
      // Legacy fields for backward compatibility
      problemTitle: data.problemTitle,
      problemSlug: data.problemSlug || data.slug,
      submissionTime: data.submissionTime || data.timestamp,
      language: data.language,
      contestId: data.contestId
    };
    
    // Set platform-specific username fields
    if (data.platform === 'leetcode') {
      submissionData.leetcodeUsername = data.username;
    } else if (data.platform === 'codeforces') {
      submissionData.codeforcesUsername = data.username;
    } else if (data.platform === 'gfg') {
      submissionData.gfgUsername = data.username;
    }
    
    const submission = new Submission(submissionData);
    await submission.save();
    console.log('Received submission:', submissionData);
    res.status(201).json({ success: true, message: 'Submission saved', data: submission });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('SkillPort Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});