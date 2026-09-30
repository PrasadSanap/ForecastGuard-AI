const Simulation = require('../models/Simulation');
const BustRisk = require('../models/BustRisk');
const ml = require('../services/mlClient');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { withDefaults, pickDefined } = require('../utils/features');
const { assess } = require('../services/reliabilityService');
const { findRegion } = require('./regionController');

// POST /api/simulation
// Baseline = region's current assessed inputs (if regionId) or neutral conditions.
// Scenario = baseline overridden by the supplied slider values.
exports.run = asyncHandler(async (req, res) => {
  const horizon = Number(req.body.horizon);
  let baseline = withDefaults({ horizon });
  let lat = 20;
  let regionName = null;

  if (req.body.regionId) {
    const region = await findRegion(req.body.regionId);
    if (!region) throw new ApiError(404, 'Region not found');
    lat = region.lat; regionName = region.name;
    const current = await BustRisk.findOne({ region: region._id, horizon }).sort({ date: -1 }).lean();
    if (current && current.inputs) baseline = withDefaults({ ...current.inputs, horizon });
  }

  const overrides = pickDefined({
    ...req.body,
    historicalMAE: req.body.historicalError !== undefined ? req.body.historicalError : req.body.historicalMAE,
  });
  const scenario = { ...baseline, ...overrides, horizon };

  const [before, after, ml_sim] = await Promise.all([
    assess(baseline, { lat }), assess(scenario, { lat }), ml.simulate(baseline, scenario),
  ]);

  const output = {
    region: regionName,
    baseline, scenario, before, after,
    changeInBustProbability: Math.round((after.bustProbability - before.bustProbability) * 10) / 10,
    changeInConfidence: Math.round((after.confidence - before.confidence) * 10) / 10,
    mostInfluentialFactor: ml_sim.mostInfluentialFactor,
    factorImpacts: ml_sim.factorImpacts,
    scenarioEvents: after.events,
    mode: 'SIMULATION MODE',
    label: 'SIMULATION — NOT AN OFFICIAL WEATHER FORECAST',
  };
  await Simulation.create({ user: req.user._id, mode: 'simulation', inputs: { ...overrides, horizon, regionId: req.body.regionId || null }, outputs: output });
  res.json({ success: true, ...output });
});