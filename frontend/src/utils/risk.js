export const RISK = {
  LOW: { color: '#22c55e' },
  MODERATE: { color: '#f59e0b' },
  HIGH: { color: '#f97316' },
  CRITICAL: { color: '#ef4444' },
};
export const riskColor = (level) => (RISK[level] ? RISK[level].color : '#64748b');

// Confidence bands from the problem brief.
export const CONF_BANDS = [
  { min: 90, label: 'Very High', range: '90–100', color: '#22c55e' },
  { min: 70, label: 'High', range: '70–89', color: '#84cc16' },
  { min: 50, label: 'Moderate', range: '50–69', color: '#f59e0b' },
  { min: 30, label: 'Low', range: '30–49', color: '#f97316' },
  { min: 0, label: 'Very Low', range: '0–29', color: '#ef4444' },
];
export const confBand = (c) => CONF_BANDS.find((b) => c >= b.min) || CONF_BANDS[CONF_BANDS.length - 1];

const ERROR_COLORS = { Low: '#22c55e', Moderate: '#f59e0b', High: '#ef4444' };

export const METRICS = {
  bust: { label: 'Bust Probability' },
  confidence: { label: 'Confidence' },
  error: { label: 'Expected Error' },
};

export function colorFor(metric, item) {
  if (metric === 'confidence') return confBand(item.confidence).color;
  if (metric === 'error') return ERROR_COLORS[item.expectedErrorLevel] || '#64748b';
  return riskColor(item.riskLevel);
}

export function metricValue(metric, item) {
  if (metric === 'confidence') return `${item.confidence}%`;
  if (metric === 'error') return `${item.expectedErrorLevel} (${item.expectedError})`;
  return `${item.bustProbability}%`;
}

export const LEGENDS = {
  bust: [
    { label: 'Low  (<25%)', color: RISK.LOW.color },
    { label: 'Moderate  (25–49%)', color: RISK.MODERATE.color },
    { label: 'High  (50–74%)', color: RISK.HIGH.color },
    { label: 'Critical  (≥75%)', color: RISK.CRITICAL.color },
  ],
  confidence: CONF_BANDS.map((b) => ({ label: `${b.range}  ${b.label}`, color: b.color })),
  error: [
    { label: 'Low', color: ERROR_COLORS.Low },
    { label: 'Moderate', color: ERROR_COLORS.Moderate },
    { label: 'High', color: ERROR_COLORS.High },
  ],
};

// Sort so the items needing most attention come first for the chosen metric.
export function sortByAttention(metric, items) {
  const arr = [...items];
  if (metric === 'confidence') return arr.sort((a, b) => a.confidence - b.confidence);
  if (metric === 'error') return arr.sort((a, b) => b.expectedError - a.expectedError);
  return arr.sort((a, b) => b.bustProbability - a.bustProbability);
}