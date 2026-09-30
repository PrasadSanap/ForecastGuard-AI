const mongoose = require('mongoose');

module.exports = mongoose.model('ModelRun', new mongoose.Schema({
  modelVersion: String,
  status: { type: String, enum: ['GOOD', 'WARNING', 'CRITICAL'], default: 'GOOD' },
  trainingSamples: Number,
  lastTraining: Date,
  metrics: mongoose.Schema.Types.Mixed,
  dataQuality: mongoose.Schema.Types.Mixed,
  predictionLatencyMs: Number,
  source: { type: String, default: 'DEMONSTRATION DATA' },
}, { timestamps: { createdAt: true, updatedAt: false } }));