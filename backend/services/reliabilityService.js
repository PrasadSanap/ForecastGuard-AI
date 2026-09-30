const ml = require('./mlClient');

const levelFromProbability = (p) => (p < 25 ? 'LOW' : p < 50 ? 'MODERATE' : p < 75 ? 'HIGH' : 'CRITICAL');
const round1 = (x) => Math.round(x * 10) / 10;

/**
 * Full reliability assessment = ML prediction + explanation + prototype event detection.
 * Event uplift (rule-based, capped at 30 points by the ML service) is added to bust probability
 * and half of it is subtracted from confidence. This is a documented prototype assumption.
 */
async function assess(features, { month = new Date().getUTCMonth() + 1, lat = 20 } = {}) {
  const [exp, ev] = await Promise.all([
    ml.explain(features),
    ml.detectEvent({
      rain: features.rainfallAnomaly, pressure: features.pressureChange,
      wind: features.windChange, temp: features.temperatureAnomaly,
      month, regionLat: lat,
    }),
  ]);
  const p = exp.prediction;
  const uplift = (ev.riskUplift || 0) * 100;
  const bust = Math.min(99, p.bustProbability + uplift);
  return {
    horizon: features.horizon,
    confidence: round1(Math.max(1, p.confidence - uplift * 0.5)),
    bustProbability: round1(bust),
    expectedError: p.expectedError,
    expectedErrorLevel: p.expectedErrorLevel,
    riskLevel: levelFromProbability(bust),
    anomalyScore: p.anomalyScore,
    eventUplift: round1(uplift),
    contributors: exp.contributors,
    explanationMethod: exp.method,
    events: ev.events,
    eventLabel: ev.label,
    modelVersion: p.modelVersion,
    latencyMs: p.latencyMs,
    label: 'MODEL ESTIMATE',
  };
}

module.exports = { assess, levelFromProbability };