const ForecastError = require('../models/ForecastError');
const asyncHandler = require('../utils/asyncHandler');
const { buildFilter } = require('../utils/queryFilters');
const { buildSummary } = require('../services/errorAnalytics');
const { normError, round } = require('../utils/errorStats');
const { bustThreshold } = require('../utils/variables');

// GET /api/errors?region=&variable=&horizon=&from=&to=&page=&limit=&sort=date|absoluteError|relativeError
exports.list = asyncHandler(async (req, res) => {
  const filter = await buildFilter(req.query);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 25));
  const sortKey = ['date', 'absoluteError', 'relativeError'].includes(req.query.sort) ? req.query.sort : 'date';
  const [total, docs] = await Promise.all([
    ForecastError.countDocuments(filter),
    ForecastError.find(filter).populate('region', 'name code').sort({ [sortKey]: -1 })
      .skip((page - 1) * limit).limit(limit).lean(),
  ]);
  res.json({
    success: true, page, limit, total, pages: Math.ceil(total / limit),
    items: docs.map((d) => ({
      id: d._id, region: d.region && d.region.name, regionCode: d.region && d.region.code,
      date: d.date, horizon: d.horizon, variable: d.variable,
      forecastValue: d.forecastValue, observedValue: d.observedValue,
      absoluteError: d.absoluteError, relativeError: d.relativeError,
      normalizedError: round(normError(d), 3), historicalBust: normError(d) >= bustThreshold(), source: d.source,
    })),
  });
});

// GET /api/errors/summary  (same filters)
exports.summary = asyncHandler(async (req, res) => {
  const filter = await buildFilter(req.query);
  const summary = await buildSummary(filter);
  res.json({ success: true, ...summary });
});