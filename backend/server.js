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
    const submission = new Submission(req.body);
    await submission.save();
    console.log('Received submission:', req.body);
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