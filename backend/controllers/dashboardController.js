const BustRisk = require('../models/BustRisk');
const Region = require('../models/Region');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { primaryDriver, regionBrief } = require('../utils/shapeRisk');

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const r1 = (x) => Math.round(x * 10) / 10;
const ATTENTION_THRESHOLD = 50;   // max bust probability across Day 1-10
const STABLE_THRESHOLD = 35;

exports.overview = asyncHandler(async (req, res) => {
  const latest = await BustRisk.findOne().sort({ date: -1 }).select('date');
  if (!latest) throw new ApiError(404, 'No risk data found. Run: npm run seed');
  const docs = await BustRisk.find({ date: latest.date }).populate('region').lean();
  const regionCount = await Region.countDocuments();

  const trend = Array.from({ length: 10 }, (_, i) => {
    const d = docs.filter((x) => x.horizon === i + 1);
    return {
      day: i + 1,
      confidence: r1(mean(d.map((x) => x.confidence))),
      bustProbability: r1(mean(d.map((x) => x.bustProbability))),
      expectedError: r1(mean(d.map((x) => x.expectedError || 0))),
    };
  });

  const byRegion = new Map();
  docs.forEach((d) => {
    const k = String(d.region._id);
    if (!byRegion.has(k)) byRegion.set(k, []);
    byRegion.get(k).push(d);
  });

  const summaries = [...byRegion.values()].map((list) => {
    const worst = list.reduce((a, b) => (b.bustProbability > a.bustProbability ? b : a));
    return {
      region: regionBrief(worst.region), worstDay: worst.horizon,
      maxBustProbability: worst.bustProbability, confidenceAtWorst: worst.confidence,
      riskLevel: worst.riskLevel, primaryDriver: primaryDriver(worst),
    };
  }).sort((a, b) => b.maxBustProbability - a.maxBustProbability);

  const attention = summaries.filter((s) => s.maxBustProbability >= ATTENTION_THRESHOLD);
  const stable = summaries.filter((s) => s.maxBustProbability < STABLE_THRESHOLD);

  const eventMap = {};
  docs.forEach((d) => (d.events || []).forEach((e) => {
    eventMap[e.event] = eventMap[e.event] || { event: e.event, regions: new Set() };
    eventMap[e.event].regions.add(d.region.name);
  }));
  const events = Object.values(eventMap)
    .map((e) => ({ event: e.event, regions: [...e.regions], count: e.regions.size }))
    .sort((a, b) => b.count - a.count);

  const below60 = trend.find((t) => t.confidence < 60);
  const insight = below60
    ? `Forecast confidence declines below 60% from Day ${below60.day} across the assessed regions; ${attention.length} region(s) show elevated bust probability.`
    : `Average forecast confidence stays above 60% through Day 10; ${attention.length} region(s) show elevated bust probability.`;

  res.json({
    success: true,
    date: latest.date,
    lastUpdated: docs.reduce((m, d) => (d.createdAt > m ? d.createdAt : m), docs[0].createdAt),
    mode: 'DEMONSTRATION MODE',
    label: 'MODEL ESTIMATE',
    kpis: {
      overallConfidence: r1(mean(docs.map((d) => d.confidence))),
      averageBustProbability: r1(mean(docs.map((d) => d.bustProbability))),
      regionsRequiringAttention: attention.length,
      highRiskForecastWindows: docs.filter((d) => ['HIGH', 'CRITICAL'].includes(d.riskLevel)).length,
      dataCoverage: r1((byRegion.size / Math.max(regionCount, 1)) * 100 * (docs.length / Math.max(byRegion.size * 10, 1))),
    },
    trend,
    highRiskRegions: attention.slice(0, 8),
    summary: {
      stableRegions: stable.map((s) => s.region.name),
      regionsRequiringAttention: attention.map((s) => ({ name: s.region.name, day: s.worstDay, bustProbability: s.maxBustProbability })),
      weatherSystemIndicators: events,
      thresholds: { attention: ATTENTION_THRESHOLD, stable: STABLE_THRESHOLD },
    },
    insight,
    disclaimer: 'ForecastGuard AI estimates forecast reliability. It does not produce weather forecasts and is not an official NCMRWF product.',
  });
});