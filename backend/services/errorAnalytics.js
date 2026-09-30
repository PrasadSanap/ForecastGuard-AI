const ForecastError = require('../models/ForecastError');
const Region = require('../models/Region');
const { summarize, groupBy } = require('../utils/errorStats');
const { VARIABLES, UNITS, bustThreshold, SCALE } = require('../utils/variables');

const MAX_RECORDS = 200000;

/** Loads only the fields analytics needs. */
const loadErrors = (filter) =>
  ForecastError.find(filter).select('region date horizon variable absoluteError relativeError')
    .limit(MAX_RECORDS).lean();

/** Complete historical-error summary for a filter. */
async function buildSummary(filter) {
  const items = await loadErrors(filter);
  const single = Boolean(filter.variable);

  const hGroups = groupBy(items, (e) => e.horizon);
  const byHorizon = Array.from({ length: 10 }, (_, i) => ({
    day: i + 1, ...summarize(hGroups.get(i + 1) || [], { singleVariable: single }),
  }));

  const vGroups = groupBy(items, (e) => e.variable);
  const byVariable = VARIABLES.map((v) => ({
    variable: v, unit: UNITS[v], ...summarize(vGroups.get(v) || [], { singleVariable: true }),
  })).filter((v) => v.count > 0);

  const regions = await Region.find().select('name code').lean();
  const rGroups = groupBy(items, (e) => String(e.region));
  const byRegion = regions.map((r) => ({
    regionId: r._id, region: r.name, code: r.code,
    ...summarize(rGroups.get(String(r._id)) || [], { singleVariable: single }),
  })).filter((r) => r.count > 0)
    .sort((a, b) => b.bustFrequency - a.bustFrequency);

  const dGroups = groupBy(items, (e) => new Date(e.date).toISOString().slice(0, 10));
  const byDate = [...dGroups.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([date, list]) => ({ date, ...summarize(list, { singleVariable: single }) }));

  return {
    count: items.length,
    singleVariable: single,
    overall: summarize(items, { singleVariable: single }),
    byHorizon, byVariable, byRegion, byDate,
    bustDefinition: {
      rule: 'normalised error = |forecast - observed| / variable scale; historical bust if >= threshold',
      threshold: bustThreshold(), variableScale: SCALE,
      note: 'Configurable prototype assumption, not an official NCMRWF definition.',
    },
  };
}

module.exports = { buildSummary, loadErrors };