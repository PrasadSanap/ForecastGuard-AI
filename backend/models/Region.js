const mongoose = require('mongoose');

module.exports = mongoose.model('Region', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, lowercase: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  zone: { type: String, enum: ['North', 'South', 'East', 'West', 'Central', 'Northeast'] },
}, { timestamps: true }));