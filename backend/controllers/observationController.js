const Observation = require('../models/Observation');
const asyncHandler = require('../utils/asyncHandler');
const { buildFilter } = require('../utils/queryFilters');

// GET /api/observations?region=&variable=&from=&to=&limit=
exports.list = asyncHandler(async (req, res) => {
  const { horizon, ...q } = req.query;          // observations have no horizon
  const filter = await buildFilter(q);
  const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 200));
  const docs = await Observation.find(filter).populate('region', 'name code').sort({ date: -1 }).limit(limit).lean();
  res.json({
    success: true, count: docs.length,
    items: docs.map((d) => ({
      id: d._id, region: d.region && d.region.name, regionCode: d.region && d.region.code,
      date: d.date, variable: d.variable, observedValue: d.observedValue, source: d.source,
    })),
  });
});