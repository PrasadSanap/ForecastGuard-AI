// Deterministic stand-in for the FastAPI service (used via jest.mock in api.test.js).
const level = (p) => (p < 25 ? 'LOW' : p < 50 ? 'MODERATE' : p < 75 ? 'HIGH' : 'CRITICAL');

const predict = (f = {}) => {
  const h = f.horizon || 5;
  const s = Math.abs(f.rainfallAnomaly || 0) + Math.abs(f.pressureChange || 0) + Math.abs(f.windChange || 0);
  const bust = Math.min(95, Math.round((5 * h + 8 * s) * 10) / 10);
  return {
    confidence: Math.round(Math.max(5, 100 - bust * 0.9) * 10) / 10, bustProbability: bust,
    expectedError: Math.round(bust * 0.1 * 100) / 100,
    expectedErrorLevel: bust > 50 ? 'High' : bust > 25 ? 'Moderate' : 'Low',
    riskLevel: level(bust), anomalyScore: 0.4, modelVersion: 'test-0', label: 'MODEL ESTIMATE', latencyMs: 1,
  };
};

module.exports = {
  health: async () => ({ status: 'ok' }),
  modelHealth: async () => ({
    modelVersion: 'test-0', status: 'GOOD', lastTraining: new Date().toISOString(),
    metrics: { maeNormalised: 0.1, aucBust: 0.9, trainingSamples: 1000, bustRate: 0.2 },
    featuresAvailable: ['horizon', 'rainfallAnomaly', 'pressureChange', 'windChange', 'temperatureAnomaly', 'historicalMAE', 'humidityInstability'],
    regionsCovered: 2, horizons: 10, bustThreshold: 0.55, errorScale: 12, uptimeSeconds: 5,
  }),
  predictBust: async (f) => predict(f),
  predictError: async (f) => predict(f),
  predictConfidence: async (f) => predict(f),
  explain: async (f) => ({
    prediction: predict(f), method: 'importance-weighted deviation', label: 'Model-generated explanation',
    contributors: [
      { feature: 'Rainfall anomaly', key: 'rainfallAnomaly', contribution: 60, direction: 'increases risk' },
      { feature: 'Forecast horizon', key: 'horizon', contribution: 40, direction: 'increases risk' },
    ],
  }),
  simulate: async (b, s) => ({
    before: predict(b), after: predict(s),
    mostInfluentialFactor: { factor: 'Rainfall anomaly', deltaBustProbability: 10 },
    factorImpacts: [{ factor: 'Rainfall anomaly', deltaBustProbability: 10 }],
  }),
  detectEvent: async (e) => {
    const heavy = (e.rain || 0) > 1.5;
    return {
      events: heavy ? [{ event: 'Heavy Rainfall', basis: 'Strong positive rainfall anomaly' }] : [],
      riskUplift: heavy ? 0.1 : 0, label: 'Prototype Event Detection — potential event indicator',
    };
  },
};