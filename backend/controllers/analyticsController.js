const BustRisk = require('../models/BustRisk');
const asyncHandler = require('../utils/asyncHandler');
const { buildFilter } = require('../utils/queryFilters');
const { buildSummary } = require('../services/errorAnalytics');
const { round } = require('../utils/errorStats');

// GET /api/analytics/overview?region=&variable=&horizon=&from=&to=
exports.overview = asyncHandler(async (req, res) => {
  const s = await buildSummary(await buildFilter(req.query));
  res.json({
    success: true, count: s.count, singleVariable: s.singleVariable, overall: s.overall,
    byVariable: s.byVariable, trend: s.byDate, bustDefinition: s.bustDefinition,
  });
});

// GET /api/analytics/horizon  -> error by horizon + confidence-vs-error pairs
exports.horizon = asyncHandler(async (req, res) => {
  const filter = await buildFilter(req.query);
  const s = await buildSummary(filter);

  const riskFilter = filter.region ? { region: filter.region } : {};
  const latest = await BustRisk.findOne(riskFilter).sort({ date: -1 }).select('date');
  const conf = latest
    ? await BustRisk.aggregate([
      { $match: { ...riskFilter, date: latest.date } },
      { $group: { _id: '$horizon', confidence: { $avg: '$confidence' }, bustProbability: { $avg: '$bustProbability' } } },
    ])
    : [];
  const confByDay = Object.fromEntries(conf.map((c) => [c._id, c]));

  res.json({
    success: true, singleVariable: s.singleVariable, horizons: s.byHorizon,
    confidenceVsError: s.byHorizon.map((h) => ({
      day: h.day,
      predictedConfidence: confByDay[h.day] ? round(confByDay[h.day].confidence, 1) : null,
      predictedBustProbability: confByDay[h.day] ? round(confByDay[h.day].bustProbability, 1) : null,
      observedMeanNormalizedError: h.meanNormalizedError,
      observedBustFrequency: h.bustFrequency,
    })),
    bustDefinition: s.bustDefinition,
    label: 'DEMONSTRATION DATA',
  });
});

// GET /api/analytics/regions
exports.regions = asyncHandler(async (req, res) => {
  const s = await buildSummary(await buildFilter(req.query));
  res.json({ success: true, singleVariable: s.singleVariable, regions: s.byRegion, bustDefinition: s.bustDefinition });
});