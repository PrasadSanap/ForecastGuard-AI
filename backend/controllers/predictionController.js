const Simulation = require('../models/Simulation');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { withDefaults } = require('../utils/features');
const { assess } = require('../services/reliabilityService');
const { findRegion } = require('./regionController');

// POST /api/predictions  { horizon, rainfallAnomaly, ..., regionId?, month? }
exports.create = asyncHandler(async (req, res) => {
  const features = withDefaults(req.body);
  let lat = 20;
  if (req.body.regionId) {
    const region = await findRegion(req.body.regionId);
    if (!region) throw new ApiError(404, 'Region not found');
    lat = region.lat;
  }
  const month = Number(req.body.month) || new Date().getUTCMonth() + 1;
  const result = await assess(features, { month, lat });
  const saved = await Simulation.create({
    user: req.user._id, mode: 'prediction',
    inputs: { ...features, regionId: req.body.regionId || null, month }, outputs: result,
  });
  res.status(201).json({ success: true, id: saved._id, inputs: features, result, mode: 'DEMONSTRATION MODE' });
});

// GET /api/predictions  -> current user's saved predictions
exports.list = asyncHandler(async (req, res) => {
  const items = await Simulation.find({ user: req.user._id, mode: 'prediction' })
    .sort({ createdAt: -1 }).limit(50).lean();
  res.json({ success: true, count: items.length, items });
});