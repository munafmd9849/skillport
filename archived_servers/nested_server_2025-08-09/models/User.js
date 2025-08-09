const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'mentor', 'student'], required: true },
  assignedBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  communities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }],
  contestsParticipated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contest' }],
  contestsCreated: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contest' }],
  totalScore: { type: Number, default: 0 },
  problemsSolved: { type: Number, default: 0 },
  badges: [{
    name: { type: String },
    description: { type: String },
    awardedOn: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
