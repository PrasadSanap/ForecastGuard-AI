const Forecast = require('../models/Forecast');
const ForecastError = require('../models/ForecastError');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { buildFilter } = require('../utils/queryFilters');
const { summarize, normError, round } = require('../utils/errorStats');
const { UNITS, SCALE, bustThreshold, normalizeVariable } = require('../utils/variables');

const iso = (d) => new Date(d).toISOString().slice(0, 10);

// GET /api/forecasts?region=&variable=&horizon=&from=&to=&limit=
exports.list = asyncHandler(async (req, res) => {
  const filter = await buildFilter(req.query);
  const limit = Math.min(1000, Math.max(1, Number(req.query.limit) || 200));
  const docs = await Forecast.find(filter).populate('region', 'name code').sort({ date: -1, horizon: 1 }).limit(limit).lean();
  res.json({
    success: true, count: docs.length,
    items: docs.map((d) => ({
      id: d._id, region: d.region && d.region.name, regionCode: d.region && d.region.code,
      date: d.date, horizon: d.horizon, variable: d.variable, forecastValue: d.forecastValue, source: d.source,
    })),
  });
});

const decorate = (e) => {
  const ne = normError(e);
  return {
    date: iso(e.date), horizon: e.horizon, forecast: e.forecastValue, observed: e.observedValue,
    absoluteError: e.absoluteError, relativeError: e.relativeError,
    normalizedError: round(ne, 3), flagged: ne >= bustThreshold(), source: e.source,
  };
};

/**
 * GET /api/forecasts/:regionId?variable=rainfall&horizon=3&date=2026-09-25
 * Forecast Replay: forecast vs observation.
 *  - series:         chosen horizon across dates
 *  - horizonProfile: chosen date across horizons D1-D10 (how error grows with lead time)
 */
exports.replay = asyncHandler(async (req, res) => {
  const variable = normalizeVariable(req.query.variable || 'rainfall');
  if (!variable) throw new ApiError(400, 'Invalid variable');
  const horizon = Number(req.query.horizon || 3);
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 10) throw new ApiError(400, 'horizon must be an integer 1-10');

  const base = await buildFilter({ variable: req.query.variable || 'rainfall' }, { regionId: req.params.regionId });
  const availableDates = (await ForecastError.distinct('date', base)).map(iso).sort().reverse();
  if (!availableDates.length) throw new ApiError(404, 'No forecast history for this region and variable');

  let selectedDate = availableDates[0];
  if (req.query.date) {
    const d = new Date(req.query.date);
    if (Number.isNaN(d.getTime())) throw new ApiError(400, 'date is not valid');
    selectedDate = iso(d);
  }
  const day = new Date(`${selectedDate}T00:00:00.000Z`);

  const [seriesDocs, profileDocs] = await Promise.all([
    ForecastError.find({ ...base, horizon }).sort('date').lean(),
    ForecastError.find({ ...base, date: day }).sort('horizon').lean(),
  ]);
  const series = seriesDocs.map(decorate);
  const horizonProfile = profileDocs.map(decorate);
  const sources = [...new Set([...seriesDocs, ...profileDocs].map((d) => d.source))];

  res.json({
    success: true, regionId: base.region, variable, unit: UNITS[variable], horizon, selectedDate,
    availableDates, series, horizonProfile,
    stats: {
      series: summarize(seriesDocs, { singleVariable: true }),
      horizonProfile: summarize(profileDocs, { singleVariable: true }),
    },
    deviationRule: {
      description: 'A point is flagged when |forecast - observed| >= threshold x variable scale',
      threshold: bustThreshold(), absoluteThreshold: round(bustThreshold() * SCALE[variable], 2),
    },
    dataSources: sources,
    label: sources.every((s) => s === 'DEMONSTRATION DATA') ? 'DEMONSTRATION DATA' : 'MIXED / UPLOADED DATA',
  });
});