const mongoose = require('mongoose');

module.exports = mongoose.model('Simulation', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  mode: { type: String, enum: ['simulation', 'prediction'], default: 'simulation' },
  inputs: mongoose.Schema.Types.Mixed,
  outputs: mongoose.Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } }));