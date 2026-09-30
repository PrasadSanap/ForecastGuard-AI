const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  date: { type: Date, required: true },
  horizon: { type: Number, min: 1, max: 10, required: true },
  variable: { type: String, enum: ['temperature', 'rainfall', 'windSpeed', 'pressure', 'humidity'], required: true },
  forecastValue: Number,
  observedValue: Number,
  absoluteError: Number,
  relativeError: Number,      // percent
  source: { type: String, default: 'DEMONSTRATION DATA' },
}, { timestamps: { createdAt: true, updatedAt: false } });

schema.index({ region: 1, date: 1, variable: 1, horizon: 1 });
module.exports = mongoose.model('ForecastError', schema);