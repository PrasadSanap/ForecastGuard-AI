const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  date: { type: Date, required: true },                // issue date of the assessment
  horizon: { type: Number, min: 1, max: 10, required: true },
  confidence: { type: Number, min: 0, max: 100, required: true },
  bustProbability: { type: Number, min: 0, max: 100, required: true },
  expectedError: Number,
  expectedErrorLevel: { type: String, enum: ['Low', 'Moderate', 'High'] },
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], required: true },
  contributors: [{ _id: false, feature: String, key: String, contribution: Number, direction: String }],
  events: [{ _id: false, event: String, basis: String }],
  eventUplift: { type: Number, default: 0 },
  inputs: mongoose.Schema.Types.Mixed,                 // feature vector used for this assessment
  modelVersion: String,
  source: { type: String, default: 'DEMONSTRATION DATA' },
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ region: 1, date: 1, horizon: 1 }, { unique: true });
module.exports = mongoose.model('BustRisk', schema);