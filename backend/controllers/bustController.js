const BustRisk = require('../models/BustRisk');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { shape } = require('../utils/shapeRisk');
const { findRegion } = require('./regionController');

const latestDate = async () => {
  const d = await BustRisk.findOne().sort({ date: -1 }).select('date');
  if (!d) throw new ApiError(404, 'No risk data found. Run: npm run seed');
  return d.date;
};

// GET /api/bust-risk?day=6&risk=HIGH&sort=bustProbability
exports.list = asyncHandler(async (req, res) => {
  const date = await latestDate();
  const filter = { date };
  if (req.query.day) filter.horizon = Number(req.query.day);
  if (req.query.risk) filter.riskLevel = String(req.query.risk).toUpperCase();
  const sortKey = ['bustProbability', 'confidence', 'expectedError'].includes(req.query.sort)
    ? req.query.sort : 'bustProbability';
  const sortDir = sortKey === 'confidence' ? 1 : -1;      // low confidence = needs attention first
  const docs = await BustRisk.find(filter).populate('region').sort({ [sortKey]: sortDir }).lean();
  res.json({
    success: true, date, count: docs.length, items: docs.map(shape),
    label: 'MODEL ESTIMATE', mode: 'DEMONSTRATION MODE',
  });
});

// GET /api/bust-risk/:regionId?day=6 -> Day 1-10 decay curve + explanation for selected day
exports.getRegion = asyncHandler(async (req, res) => {
  const region = await findRegion(req.params.regionId);
  if (!region) throw new ApiError(404, 'Region not found');
  const date = await latestDate();
  const docs = await BustRisk.find({ region: region._id, date }).sort('horizon').lean();
  if (!docs.length) throw new ApiError(404, 'No risk data for this region');
  const day = Math.min(10, Math.max(1, Number(req.query.day) || docs.reduce((a, b) => (b.bustProbability > a.bustProbability ? b : a)).horizon));
  const selected = docs.find((d) => d.horizon === day) || docs[0];
  res.json({
    success: true, date, region,
    selectedDay: selected.horizon,
    selected: shape({ ...selected, region }),
    curve: docs.map((d) => ({
      day: d.horizon, confidence: d.confidence, bustProbability: d.bustProbability,
      expectedError: d.expectedError, riskLevel: d.riskLevel,
    })),
    events: [...new Map(docs.flatMap((d) => d.events || []).map((e) => [e.event, e])).values()],
    label: 'MODEL ESTIMATE', mode: 'DEMONSTRATION MODE',
  });
});