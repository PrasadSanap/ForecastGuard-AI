/**
 * Idempotent seed. Safe to run repeatedly:
 *  - users / regions are upserted by email / code
 *  - all "DEMONSTRATION DATA" documents are deleted and rebuilt (uploaded data is untouched)
 * Requires MongoDB and the ML service (http://localhost:8000) to be running.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../utils/db');
const ml = require('../services/mlClient');
const { assess } = require('../services/reliabilityService');
const { makeRng } = require('../utils/random');
const { primaryDriver } = require('../utils/shapeRisk');
const { REGIONS, HOTSPOTS } = require('./regionsData');
const User = require('../models/User');
const Region = require('../models/Region');
const Forecast = require('../models/Forecast');
const Observation = require('../models/Observation');
const ForecastError = require('../models/ForecastError');
const BustRisk = require('../models/BustRisk');
const Alert = require('../models/Alert');
const ModelRun = require('../models/ModelRun');

const DEMO = 'DEMONSTRATION DATA';
const HISTORY_DAYS = 10;
const DAY = 86400000;
const VARS = {
  temperature: { base: 31, sd: 1.2 }, rainfall: { base: 6, sd: 6 }, humidity: { base: 72, sd: 6 },
  pressure: { base: 1008, sd: 1.5 }, windSpeed: { base: 12, sd: 2.5 },
};
const USERS = [
  { name: 'Demo Analyst', email: 'analyst@forecastguard.demo', password: 'Analyst@123', role: 'Analyst' },
  { name: 'Demo Researcher', email: 'researcher@forecastguard.demo', password: 'Researcher@123', role: 'Researcher' },
  { name: 'Demo Admin', email: 'admin@forecastguard.demo', password: 'Admin@123', role: 'Admin' },
];
const SEVERITY = { CRITICAL: 'Critical', HIGH: 'High', MODERATE: 'Moderate' };
const ACTION = 'Review forecast with updated observations and ensemble/meteorological guidance.';
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const chunked = async (Model, docs, size = 5000) => {
  for (let i = 0; i < docs.length; i += size) await Model.insertMany(docs.slice(i, i + size), { ordered: false });
};

async function main() {
  await connectDB();
  await ml.health().catch(() => { throw new Error('ML service not reachable at ' + (process.env.ML_SERVICE_URL || 'http://localhost:8000') + '. Start it first.'); });

  // Users (upsert: create if missing so password hashing hook runs once)
  for (const u of USERS) if (!(await User.findOne({ email: u.email }))) await User.create(u);

  // Regions
  await Region.bulkWrite(REGIONS.map((r) => ({ updateOne: { filter: { code: r.code }, update: { $set: r }, upsert: true } })));
  const regions = await Region.find().lean();
  const byName = Object.fromEntries(regions.map((r) => [r.name, r]));

  // Wipe previous demonstration documents
  await Promise.all([Forecast, Observation, ForecastError, BustRisk, Alert, ModelRun].map((M) => M.deleteMany({ source: DEMO })));

  const rng = makeRng(2026);
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const state = {};
  for (const r of REGIONS) {
    const h = HOTSPOTS[r.name] || {};
    state[r.name] = {
      rain: h.rain ?? rng.normal(0, 0.6), pres: h.pres ?? rng.normal(0, 0.6), wind: h.wind ?? rng.normal(0, 0.6),
      temp: h.temp ?? rng.normal(0, 0.6), hum: Math.abs(h.hum ?? rng.normal(0, 0.5)),
      mae: rng.uniform(1.0, 2.0), vol: rng.uniform(0.8, 1.3),
    };
  }

  // Historical forecasts, observations and errors
  const forecasts = [], observations = [], errors = [];
  for (const r of REGIONS) {
    const s = state[r.name], reg = byName[r.name];
    for (let back = HISTORY_DAYS; back >= 1; back--) {
      const date = new Date(today.getTime() - back * DAY);
      for (const [variable, cfg] of Object.entries(VARS)) {
        let obs = cfg.base + rng.normal(0, cfg.sd);
        if (variable === 'rainfall') obs = Math.max(0, obs + Math.max(0, s.rain) * 4);
        if (variable === 'humidity') obs = Math.min(100, obs);
        observations.push({ region: reg._id, date, variable, observedValue: round(obs), source: DEMO });
        for (let h = 1; h <= 10; h++) {
          const errSd = cfg.sd * (0.25 + 0.12 * h) * s.vol * (1 + 0.35 * Math.abs(s.rain));
          let fc = obs + rng.normal(0, errSd);
          if (variable === 'rainfall' || variable === 'windSpeed') fc = Math.max(0, fc);
          if (variable === 'humidity') fc = Math.min(100, Math.max(0, fc));
          const absErr = Math.abs(fc - obs);
          forecasts.push({ region: reg._id, date, horizon: h, variable, forecastValue: round(fc), source: DEMO });
          errors.push({
            region: reg._id, date, horizon: h, variable, forecastValue: round(fc), observedValue: round(obs),
            absoluteError: round(absErr), relativeError: round((absErr / Math.max(Math.abs(obs), 1)) * 100, 1), source: DEMO,
          });
        }
      }
    }
  }
  await chunked(Forecast, forecasts); await chunked(Observation, observations); await chunked(ForecastError, errors);

  // Reliability assessments for today: 20 regions x 10 horizons via the ML service
  const month = today.getUTCMonth() + 1;
  const risks = [], latencies = [];
  for (const r of REGIONS) {
    const s = state[r.name];
    const results = await Promise.all(Array.from({ length: 10 }, (_, i) => {
      const h = i + 1, k = 1 + 0.04 * h;
      const inputs = {
        horizon: h,
        rainfallAnomaly: round(s.rain * k + rng.normal(0, 0.15)),
        pressureChange: round(s.pres * k + rng.normal(0, 0.15)),
        windChange: round(s.wind * k + rng.normal(0, 0.15)),
        temperatureAnomaly: round(s.temp * k + rng.normal(0, 0.15)),
        historicalMAE: round(s.mae + 0.1 * h),
        humidityInstability: round(s.hum),
      };
      return assess(inputs, { month, lat: r.lat }).then((a) => ({ a, inputs }));
    }));
    results.forEach(({ a, inputs }) => {
      latencies.push(a.latencyMs);
      risks.push({
        region: byName[r.name]._id, date: today, horizon: a.horizon, confidence: a.confidence,
        bustProbability: a.bustProbability, expectedError: a.expectedError, expectedErrorLevel: a.expectedErrorLevel,
        riskLevel: a.riskLevel, contributors: a.contributors, events: a.events, eventUplift: a.eventUplift,
        inputs, modelVersion: a.modelVersion, source: DEMO,
      });
    });
  }
  await BustRisk.insertMany(risks);

  // Alerts: worst horizon per region where bust probability >= 40
  const worst = {};
  risks.forEach((x) => { const k = String(x.region); if (!worst[k] || x.bustProbability > worst[k].bustProbability) worst[k] = x; });
  const picked = Object.values(worst).filter((x) => x.bustProbability >= 40 && SEVERITY[x.riskLevel])
    .sort((a, b) => b.bustProbability - a.bustProbability);
  const alerts = picked.map((x, i) => ({
    region: x.region, date: today, horizon: x.horizon, severity: SEVERITY[x.riskLevel],
    message: `${SEVERITY[x.riskLevel].toUpperCase()} FORECAST UNCERTAINTY`,
    reason: x.events.length ? x.events[0].basis : `Elevated ${primaryDriver(x).toLowerCase()}`,
    recommendedAction: ACTION, bustProbability: x.bustProbability,
    status: i >= picked.length - 2 && picked.length > 4 ? 'Resolved' : 'Active', source: DEMO,
  }));
  if (alerts.length) await Alert.insertMany(alerts);

  // Model run record
  const mh = await ml.modelHealth();
  await ModelRun.create({
    modelVersion: mh.modelVersion, status: 'GOOD', trainingSamples: mh.metrics.trainingSamples,
    lastTraining: mh.lastTraining, metrics: { ...mh.metrics, bustThreshold: mh.bustThreshold, errorScale: mh.errorScale },
    dataQuality: {
      coveragePct: round((risks.length / (REGIONS.length * 10)) * 100, 1), missingPct: 0,
      featureCoverage: round((mh.featuresAvailable.length / 7) * 100, 1), featuresAvailable: mh.featuresAvailable,
      regionsCovered: mh.regionsCovered,
    },
    predictionLatencyMs: round(latencies.reduce((a, b) => a + b, 0) / latencies.length, 1), source: DEMO,
  });

  console.log(`Seed complete (${DEMO}): ${USERS.length} users, ${regions.length} regions, ${forecasts.length} forecasts, ` +
    `${observations.length} observations, ${errors.length} errors, ${risks.length} risk records, ${alerts.length} alerts.`);
  await mongoose.disconnect();
}

main().catch(async (e) => { console.error('Seed failed:', e.message); await mongoose.disconnect(); process.exit(1); });