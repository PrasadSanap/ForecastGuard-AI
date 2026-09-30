const mongoose = require('mongoose');
const Region = require('../models/Region');
const BustRisk = require('../models/BustRisk');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Accepts either a Mongo ObjectId or a region code such as "maharashtra".
async function findRegion(idOrCode) {
  if (mongoose.isValidObjectId(idOrCode)) {
    const byId = await Region.findById(idOrCode);
    if (byId) return byId;
  }
  return Region.findOne({ code: String(idOrCode).toLowerCase() });
}

exports.findRegion = findRegion;

exports.list = asyncHandler(async (req, res) => {
  const regions = await Region.find().sort('name').lean();
  res.json({ success: true, count: regions.length, regions });
});

exports.getOne = asyncHandler(async (req, res) => {
  const region = await findRegion(req.params.id);
  if (!region) throw new ApiError(404, 'Region not found');
  const latest = await BustRisk.findOne({ region: region._id }).sort({ date: -1 }).select('date');
  const risks = latest
    ? await BustRisk.find({ region: region._id, date: latest.date }).sort('horizon').lean()
    : [];
  res.json({
    success: true, region,
    latestAssessmentDate: latest ? latest.date : null,
    horizons: risks.map((r) => ({
      day: r.horizon, confidence: r.confidence, bustProbability: r.bustProbability,
      expectedError: r.expectedError, riskLevel: r.riskLevel,
    })),
    label: 'MODEL ESTIMATE',
  });
});