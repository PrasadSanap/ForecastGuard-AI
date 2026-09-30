const Alert = require('../models/Alert');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { regionBrief } = require('../utils/shapeRisk');

const RANK = { Critical: 0, High: 1, Moderate: 2, Low: 3 };

const shape = (a) => ({
  id: a._id, region: regionBrief(a.region), date: a.date, horizon: a.horizon,
  severity: a.severity, message: a.message, reason: a.reason,
  recommendedAction: a.recommendedAction, bustProbability: a.bustProbability,
  status: a.status, acknowledgedAt: a.acknowledgedAt, createdAt: a.createdAt, source: a.source,
});

// GET /api/alerts?status=Active&severity=High
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.severity) filter.severity = req.query.severity;

  const [docs, all] = await Promise.all([
    Alert.find(filter).populate('region').lean(),
    Alert.find().select('severity status').lean(),
  ]);

  const items = docs.map(shape).sort((a, b) =>
    (a.status === 'Resolved') - (b.status === 'Resolved') ||
    RANK[a.severity] - RANK[b.severity] ||
    b.bustProbability - a.bustProbability);

  const counts = { Critical: 0, High: 0, Moderate: 0, Low: 0, Resolved: 0 };
  all.forEach((a) => { if (a.status === 'Resolved') counts.Resolved += 1; else counts[a.severity] += 1; });

  res.json({
    success: true, count: items.length, counts, items,
    notice: 'Forecast-reliability alerts only. Not emergency or warning instructions.',
    mode: 'DEMONSTRATION MODE',
  });
});

// PATCH /api/alerts/:id  { status: "Acknowledged" | "Resolved" }
exports.update = asyncHandler(async (req, res) => {
  const alert = await Alert.findById(req.params.id);
  if (!alert) throw new ApiError(404, 'Alert not found');
  if (alert.status === 'Resolved') throw new ApiError(409, 'Alert is already resolved');
  alert.status = req.body.status;
  if (!alert.acknowledgedAt) {
    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();
  }
  await alert.save();
  await alert.populate('region');
  res.json({ success: true, alert: shape(alert.toObject()) });
});