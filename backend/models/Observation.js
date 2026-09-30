const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  date: { type: Date, required: true },
  variable: { type: String, enum: ['temperature', 'rainfall', 'windSpeed', 'pressure', 'humidity'], required: true },
  observedValue: { type: Number, required: true },
  source: { type: String, default: 'DEMONSTRATION DATA' },
});

schema.index({ region: 1, date: 1, variable: 1 });
module.exports = mongoose.model('Observation', schema);