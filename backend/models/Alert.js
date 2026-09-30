const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  date: { type: Date, required: true },
  horizon: { type: Number, min: 1, max: 10, required: true },
  severity: { type: String, enum: ['Critical', 'High', 'Moderate', 'Low'], required: true },
  message: { type: String, required: true },
  reason: String,
  recommendedAction: String,
  bustProbability: Number,
  status: { type: String, enum: ['Active', 'Acknowledged', 'Resolved'], default: 'Active' },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: Date,
  source: { type: String, default: 'DEMONSTRATION DATA' },
}, { timestamps: { createdAt: true, updatedAt: false } });

module.exports = mongoose.model('Alert', schema);