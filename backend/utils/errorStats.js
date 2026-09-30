const { SCALE, bustThreshold } = require('./variables');

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const normError = (e) => e.absoluteError / (SCALE[e.variable] || 1);

/**
 * Error statistics for a list of ForecastError-like records.
 * MAE / RMSE are only meaningful in one unit, so they are returned only when singleVariable is true.
 */
function summarize(items, { singleVariable = false } = {}) {
  const n = items.length;
  if (!n) {
    return { count: 0, mae: null, rmse: null, meanRelativeError: null, meanNormalizedError: null, bustFrequency: null };
  }
  const t = bustThreshold();
  let abs = 0, sq = 0, rel = 0, norm = 0, bust = 0;
  for (const e of items) {
    const ne = normError(e);
    abs += e.absoluteError;
    sq += e.absoluteError ** 2;
    rel += e.relativeError || 0;
    norm += ne;
    if (ne >= t) bust += 1;
  }
  return {
    count: n,
    mae: singleVariable ? round(abs / n) : null,
    rmse: singleVariable ? round(Math.sqrt(sq / n)) : null,
    meanRelativeError: round(rel / n, 1),
    meanNormalizedError: round(norm / n, 3),
    bustFrequency: round((100 * bust) / n, 1),
  };
}

const groupBy = (items, keyFn) => {
  const m = new Map();
  for (const it of items) {
    const k = keyFn(it);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(it);
  }
  return m;
};

module.exports = { round, normError, summarize, groupBy };