const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
  platform: { type: String, required: true }, // e.g., "LeetCode", "GFG"
  problemName: { type: String, required: true },
  username: { type: String }, // Platform username
  url: { type: String }, // Problem URL
  slug: { type: String }, // Problem slug
  verdict: { type: String, required: true }, // "Solved", "Wrong Answer", etc.
  attempts: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
