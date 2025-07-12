const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  platform: {
    type: String,
    enum: ['leetcode', 'geeksforgeeks', 'hackerrank', 'codeforces'],
    required: [true, 'Platform is required']
  },
  problemTitle: {
    type: String,
    required: [true, 'Problem title is required'],
    trim: true
  },
  problemUrl: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty is required']
  },
  status: {
    type: String,
    enum: ['solved', 'reattempt', 'doubt', 'in-progress'],
    default: 'solved'
  },
  attempts: {
    type: Number,
    default: 1,
    min: [1, 'Attempts must be at least 1']
  },
  solution: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    trim: true
  },
  timeComplexity: {
    type: String,
    trim: true
  },
  spaceComplexity: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
submissionSchema.index({ email: 1, platform: 1 });
submissionSchema.index({ email: 1, timestamp: -1 });
submissionSchema.index({ platform: 1, difficulty: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ tags: 1 });

// Virtual for formatted date
submissionSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Method to update submission
submissionSchema.methods.updateSubmission = function(updates) {
  Object.assign(this, updates);
  this.lastModified = new Date();
  return this.save();
};

// Static method to get user statistics
submissionSchema.statics.getUserStats = async function(email) {
  const stats = await this.aggregate([
    { $match: { email: email.toLowerCase() } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
        reattempts: { $sum: { $cond: [{ $eq: ['$status', 'reattempt'] }, 1, 0] } },
        doubts: { $sum: { $cond: [{ $eq: ['$status', 'doubt'] }, 1, 0] } },
        easy: { $sum: { $cond: [{ $eq: ['$difficulty', 'easy'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$difficulty', 'medium'] }, 1, 0] } },
        hard: { $sum: { $cond: [{ $eq: ['$difficulty', 'hard'] }, 1, 0] } },
        totalAttempts: { $sum: '$attempts' }
      }
    }
  ]);
  
  return stats[0] || {
    totalSubmissions: 0,
    solved: 0,
    reattempts: 0,
    doubts: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    totalAttempts: 0
  };
};

// Static method to get platform-wise statistics
submissionSchema.statics.getPlatformStats = async function(email) {
  return await this.aggregate([
    { $match: { email: email.toLowerCase() } },
    {
      $group: {
        _id: '$platform',
        count: { $sum: 1 },
        solved: { $sum: { $cond: [{ $eq: ['$status', 'solved'] }, 1, 0] } },
        reattempts: { $sum: { $cond: [{ $eq: ['$status', 'reattempt'] }, 1, 0] } },
        doubts: { $sum: { $cond: [{ $eq: ['$status', 'doubt'] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Submission', submissionSchema); 