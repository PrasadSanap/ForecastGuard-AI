const ApiError = require('./ApiError');
const { normalizeVariable } = require('./variables');
const { findRegion } = require('../controllers/regionController');

const parseDate = (v, name) => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `${name} is not a valid date`);
  return d;
};

/** Builds a Mongo filter from ?region=&variable=&horizon=&from=&to=&source= (all optional). */
async function buildFilter(q = {}, { regionId } = {}) {
  const filter = {};
  const rid = regionId || q.region;
  if (rid) {
    const region = await findRegion(rid);
    if (!region) throw new ApiError(404, 'Region not found');
    filter.region = region._id;
  }
  if (q.variable) {
    const v = normalizeVariable(q.variable);
    if (!v) throw new ApiError(400, 'variable must be one of temperature, rainfall, windSpeed, pressure, humidity');
    filter.variable = v;
  }
  if (q.horizon) {
    const h = Number(q.horizon);
    if (!Number.isInteger(h) || h < 1 || h > 10) throw new ApiError(400, 'horizon must be an integer 1-10');
    filter.horizon = h;
  }
  if (q.from || q.to) {
    filter.date = {};
    if (q.from) filter.date.$gte = parseDate(q.from, 'from');
    if (q.to) filter.date.$lte = parseDate(q.to, 'to');
  }
  if (q.source) filter.source = String(q.source);
  return filter;
}

module.exports = { buildFilter, parseDate };