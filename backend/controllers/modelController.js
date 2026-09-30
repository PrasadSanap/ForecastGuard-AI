const Region = require('../models/Region');
const Forecast = require('../models/Forecast');
const Observation = require('../models/Observation');
const ForecastError = require('../models/ForecastError');
const BustRisk = require('../models/BustRisk');
const Alert = require('../models/Alert');
const ModelRun = require('../models/ModelRun');
const ml = require('../services/mlClient');
const asyncHandler = require('../utils/asyncHandler');
const { FEATURE_KEYS } = require('../utils/features');
const { round } = require('../utils/errorStats');

const ORDER = ['GOOD', 'WARNING', 'CRITICAL'];
const worst = (list) => list.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a), 'GOOD');

// GET /api/model/health
exports.health = asyncHandler(async (req, res) => {
  let mlHealth = null, latencyMs = null;
  try {
    mlHealth = await ml.modelHealth();
    const t0 = Date.now();
    await ml.predictBust({ horizon: 5 });
    latencyMs = Date.now() - t0;
  } catch (e) { /* ML service down: reported as CRITICAL below */ }

  const run = await ModelRun.findOne().sort({ createdAt: -1 }).lean();
  const [regions, forecasts, observations, errors, riskRecords, alerts, missing, latestRisk, sources] = await Promise.all([
    Region.countDocuments(), Forecast.countDocuments(), Observation.countDocuments(),
    ForecastError.countDocuments(), BustRisk.countDocuments(), Alert.countDocuments(),
    ForecastError.countDocuments({ $or: [{ absoluteError: null }, { forecastValue: null }, { observedValue: null }] }),
    BustRisk.findOne().sort({ date: -1 }).select('date createdAt').lean(),
    ForecastError.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
  ]);

  const latestCount = latestRisk ? await BustRisk.countDocuments({ date: latestRisk.date }) : 0;
  const coveragePct = round((latestCount / Math.max(regions * 10, 1)) * 100, 1);
  const missingPct = errors ? round((missing / errors) * 100, 2) : 0;
  const features = (mlHealth && mlHealth.featuresAvailable) || (run && run.dataQuality && run.dataQuality.featuresAvailable) || [];
  const featureCoveragePct = round((features.length / FEATURE_KEYS.length) * 100, 1);
  const ageMinutes = latestRisk ? Math.round((Date.now() - new Date(latestRisk.createdAt).getTime()) / 60000) : null;

  const checks = [
    { name: 'ML service', status: mlHealth ? 'GOOD' : 'CRITICAL', detail: mlHealth ? 'Reachable' : 'Unreachable' },
    { name: 'Data freshness', status: ageMinutes === null ? 'CRITICAL' : ageMinutes <= 2880 ? 'GOOD' : ageMinutes <= 10080 ? 'WARNING' : 'CRITICAL',
      detail: ageMinutes === null ? 'No risk assessments found' : `Last assessment ${ageMinutes} min ago` },
    { name: 'Missing data', status: missingPct <= 1 ? 'GOOD' : missingPct <= 5 ? 'WARNING' : 'CRITICAL', detail: `${missingPct}% of error records incomplete` },
    { name: 'Region-horizon coverage', status: coveragePct >= 95 ? 'GOOD' : coveragePct >= 70 ? 'WARNING' : 'CRITICAL', detail: `${coveragePct}% of region x horizon cells assessed` },
    { name: 'Feature availability', status: featureCoveragePct >= 95 ? 'GOOD' : featureCoveragePct >= 70 ? 'WARNING' : 'CRITICAL', detail: `${features.length}/${FEATURE_KEYS.length} features` },
    { name: 'Prediction latency', status: latencyMs === null ? 'CRITICAL' : latencyMs < 500 ? 'GOOD' : latencyMs < 2000 ? 'WARNING' : 'CRITICAL',
      detail: latencyMs === null ? 'Not measurable' : `${latencyMs} ms round trip` },
  ];
  const dataQuality = worst(checks.filter((c) => c.name !== 'ML service' && c.name !== 'Prediction latency').map((c) => c.status));

  res.json({
    success: true,
    status: worst(checks.map((c) => c.status)),
    dataQuality, checks,
    model: {
      version: mlHealth ? mlHealth.modelVersion : run && run.modelVersion,
      lastTraining: mlHealth ? mlHealth.lastTraining : run && run.lastTraining,
      trainingSamples: mlHealth ? mlHealth.metrics.trainingSamples : run && run.trainingSamples,
      metrics: mlHealth ? mlHealth.metrics : run && run.metrics,
      bustThreshold: mlHealth ? mlHealth.bustThreshold : undefined,
      errorScale: mlHealth ? mlHealth.errorScale : undefined,
      uptimeSeconds: mlHealth ? mlHealth.uptimeSeconds : null,
      note: 'Metrics are measured on held-out DEMONSTRATION DATA only; they say nothing about operational skill.',
    },
    service: { mlService: mlHealth ? 'ok' : 'down', predictionLatencyMs: latencyMs },
    data: {
      lastUpdated: latestRisk ? latestRisk.createdAt : null, ageMinutes, missingPct, coveragePct,
      featureCoveragePct, featuresAvailable: features,
      counts: { regions, forecasts, observations, errorRecords: errors, riskRecords, alerts },
      sources: sources.map((s) => ({ source: s._id, count: s.count })),
    },
    dataMode: 'DEMONSTRATION MODE',
  });
});