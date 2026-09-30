// Variable metadata. SCALE = typical variability (sd) of each variable in the DEMONSTRATION data;
// it lets errors of different variables (mm vs hPa vs °C) be compared on one normalised scale.
const VARIABLES = ['temperature', 'rainfall', 'windSpeed', 'pressure', 'humidity'];
const SCALE = { temperature: 1.2, rainfall: 6, humidity: 6, pressure: 1.5, windSpeed: 2.5 };
const UNITS = { temperature: '°C', rainfall: 'mm', windSpeed: 'km/h', pressure: 'hPa', humidity: '%' };

// Prototype "historical bust": normalised error (|forecast - observed| / SCALE) >= threshold.
// Configurable via BUST_NORM_ERROR. This is NOT an official NCMRWF definition.
const bustThreshold = () => Number(process.env.BUST_NORM_ERROR) || 1.0;

function normalizeVariable(v) {
  const k = String(v || '').trim().toLowerCase().replace(/[\s_-]/g, '');
  if (k === 'wind') return 'windSpeed';
  return VARIABLES.find((x) => x.toLowerCase() === k) || null;
}

module.exports = { VARIABLES, SCALE, UNITS, bustThreshold, normalizeVariable };