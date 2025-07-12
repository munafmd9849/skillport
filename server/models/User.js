const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    default: 'student',
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for username (derived from email)
userSchema.virtual('username').get(function() {
  return this.email.split('@')[0];
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ batch: 1 });

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to hash password
userSchema.methods.hashPassword = async function(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const saltRounds = 12;
    this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 