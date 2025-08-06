const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  email: { type: String, required: true },
  platform: { type: String, required: true },
  problemTitle: { type: String, required: true },
  problemSlug: { type: String },
  submissionTime: { type: Date, required: true },
  attempts: { type: Number, default: 1 },
  language: { type: String },
  contestId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Submission', submissionSchema); 