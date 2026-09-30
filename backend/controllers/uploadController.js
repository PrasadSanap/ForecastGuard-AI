const Region = require('../models/Region');
const Forecast = require('../models/Forecast');
const Observation = require('../models/Observation');
const ForecastError = require('../models/ForecastError');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { parseCSV } = require('../utils/csv');
const { normalizeVariable } = require('../utils/variables');
const { round } = require('../utils/errorStats');

const SOURCE = 'UPLOADED DATA';
const REQUIRED = ['date', 'region', 'horizon', 'variable', 'forecast', 'observed'];
const OPTIONAL = ['temperature', 'rainfall', 'humidity', 'pressure', 'windSpeed'];
const MAX_ROWS = 50000;

const TEMPLATE = [
  [...REQUIRED, ...OPTIONAL].join(','),
  '2026-09-20,Maharashtra,3,rainfall,12.5,9.1,31.2,9.1,78,1007.5,14.2',
  '2026-09-20,Maharashtra,3,temperature,31.8,32.4,32.4,9.1,78,1007.5,14.2',
].join('\n');

const num = (v) => (v !== undefined && String(v).trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

// GET /api/upload/template
exports.template = (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="forecastguard-template.csv"');
  res.send(TEMPLATE);
};

// POST /api/upload/forecast   body: raw CSV (Content-Type: text/csv) or JSON { csv: "..." }
exports.uploadForecast = asyncHandler(async (req, res) => {
  const text = typeof req.body === 'string' ? req.body : req.body && req.body.csv;
  if (!text || !String(text).trim()) throw new ApiError(400, 'Empty upload. Send CSV text as text/csv or JSON { "csv": "..." }');

  const rows = parseCSV(text);
  const header = rows[0].map((h) => h.trim());
  const lower = header.map((h) => h.toLowerCase());
  const missingColumns = REQUIRED.filter((c) => !lower.includes(c));
  if (missingColumns.length) {
    throw new ApiError(400, `Missing required column(s): ${missingColumns.join(', ')}`, {
      missingColumns, expectedRequired: REQUIRED, expectedOptional: OPTIONAL,
    });
  }
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) throw new ApiError(413, `Too many rows (max ${MAX_ROWS})`);

  const col = (name) => lower.indexOf(name.toLowerCase());
  const idx = Object.fromEntries([...REQUIRED, ...OPTIONAL].map((c) => [c, col(c)]));
  const optionalPresent = OPTIONAL.filter((c) => idx[c] !== -1);
  const optionalMissing = OPTIONAL.filter((c) => idx[c] === -1);

  const regions = await Region.find().lean();
  const regionLookup = new Map();
  regions.forEach((r) => { regionLookup.set(r.name.toLowerCase(), r); regionLookup.set(r.code, r); });

  const reasons = {}, rejectedSample = [], good = [];
  let optionalCells = 0, optionalFilled = 0;
  const reject = (rowNo, reason) => {
    reasons[reason] = (reasons[reason] || 0) + 1;
    if (rejectedSample.length < 20) rejectedSample.push({ row: rowNo, reason });
  };

  dataRows.forEach((cells, i) => {
    const rowNo = i + 2;                                  // 1-based, header is row 1
    const get = (c) => (cells[idx[c]] || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}/.test(get('date')) || Number.isNaN(new Date(get('date')).getTime())) return reject(rowNo, 'Invalid date (use YYYY-MM-DD)');
    const region = regionLookup.get(get('region').toLowerCase());
    if (!region) return reject(rowNo, 'Unknown region');
    const horizon = Number(get('horizon'));
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > 10) return reject(rowNo, 'Horizon must be an integer 1-10');
    const variable = normalizeVariable(get('variable'));
    if (!variable) return reject(rowNo, 'Unknown variable');
    const forecast = num(get('forecast')), observed = num(get('observed'));
    if (forecast === null) return reject(rowNo, 'Forecast is not a number');
    if (observed === null) return reject(rowNo, 'Observed is not a number');

    optionalPresent.forEach((c) => { optionalCells += 1; if (num(get(c)) !== null) optionalFilled += 1; });
    const date = new Date(get('date').slice(0, 10) + 'T00:00:00.000Z');
    good.push({ region: region._id, regionName: region.name, date, horizon, variable, forecast, observed });
  });

  if (!good.length) {
    return res.status(422).json({
      success: false, message: 'No valid rows to import',
      report: { rowsTotal: dataRows.length, rowsImported: 0, rowsRejected: dataRows.length,
        rejectionReasons: Object.entries(reasons).map(([reason, count]) => ({ reason, count })), rejectedSample },
    });
  }

  // Idempotent upserts: re-uploading the same file does not create duplicates.
  const ops = { f: [], o: [], e: [] };
  good.forEach((g) => {
    const key = { region: g.region, date: g.date, variable: g.variable, source: SOURCE };
    const abs = Math.abs(g.forecast - g.observed);
    ops.f.push({ updateOne: { filter: { ...key, horizon: g.horizon }, update: { $set: { forecastValue: g.forecast } }, upsert: true } });
    ops.o.push({ updateOne: { filter: key, update: { $set: { observedValue: g.observed } }, upsert: true } });
    ops.e.push({ updateOne: {
      filter: { ...key, horizon: g.horizon },
      update: { $set: { forecastValue: g.forecast, observedValue: g.observed, absoluteError: round(abs), relativeError: round((abs / Math.max(Math.abs(g.observed), 1)) * 100, 1) } },
      upsert: true } });
  });
  const run = async (Model, list) => { for (let i = 0; i < list.length; i += 1000) await Model.bulkWrite(list.slice(i, i + 1000), { ordered: false }); };
  await run(Forecast, ops.f); await run(Observation, ops.o); await run(ForecastError, ops.e);

  const total = dataRows.length;
  const acceptedPct = round((good.length / total) * 100, 1);
  const optionalCompletenessPct = optionalCells ? round((optionalFilled / optionalCells) * 100, 1) : 0;
  const dates = good.map((g) => g.date.getTime());

  res.status(201).json({
    success: true,
    report: {
      rowsTotal: total, rowsImported: good.length, rowsRejected: total - good.length,
      missingColumns: [], optionalColumnsPresent: optionalPresent, optionalColumnsMissing: optionalMissing,
      regionsAffected: [...new Set(good.map((g) => g.regionName))],
      dateRange: { from: new Date(Math.min(...dates)).toISOString().slice(0, 10), to: new Date(Math.max(...dates)).toISOString().slice(0, 10) },
      rejectionReasons: Object.entries(reasons).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count),
      rejectedSample,
      quality: { acceptedPct, optionalCompletenessPct, label: acceptedPct >= 95 ? 'GOOD' : acceptedPct >= 80 ? 'WARNING' : 'CRITICAL' },
      note: 'Rows are stored as UPLOADED DATA and feed Forecast Replay, errors and analytics. Optional context columns are validated for quality reporting; risk models are not retrained by uploads in this prototype.',
    },
  });
});