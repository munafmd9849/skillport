const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users with mentor role
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Users with student role
});

module.exports = mongoose.model('Batch', BatchSchema);
