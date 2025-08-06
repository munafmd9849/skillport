const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  // Core fields (new simplified format)
  username: { type: String },
  email: { type: String, required: true },
  url: { type: String },
  slug: { type: String },
  timestamp: { type: Date, required: true },
  platform: { type: String, required: true },
  attempts: { type: Number, default: 1 },
  
  // Legacy fields (for backward compatibility)
  problemTitle: { type: String },
  problemSlug: { type: String },
  leetcodeUsername: { type: String },
  codeforcesUsername: { type: String },
  gfgUsername: { type: String },
  submissionTime: { type: Date },
  language: { type: String },
  contestId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema);