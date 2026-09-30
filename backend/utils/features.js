// Feature names must match ml-service/app/data_generator.py FEATURES.
const FEATURE_KEYS = ['horizon', 'rainfallAnomaly', 'pressureChange', 'windChange',
  'temperatureAnomaly', 'historicalMAE', 'humidityInstability'];

const DEFAULTS = {
  rainfallAnomaly: 0, pressureChange: 0, windChange: 0,
  temperatureAnomaly: 0, historicalMAE: 1.5, humidityInstability: 0.5,
};

// Only keys the caller actually supplied (used for scenario overrides).
function pickDefined(src = {}) {
  const out = {};
  for (const k of FEATURE_KEYS) if (src[k] !== undefined && src[k] !== null) out[k] = Number(src[k]);
  return out;
}

function withDefaults(src = {}) {
  return { ...DEFAULTS, horizon: 5, ...pickDefined(src) };
}

module.exports = { FEATURE_KEYS, DEFAULTS, pickDefined, withDefaults };