process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

jest.mock('../services/mlClient', () => require('./mlMock'));

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Region = require('../models/Region');
const Forecast = require('../models/Forecast');
const Observation = require('../models/Observation');
const ForecastError = require('../models/ForecastError');
const BustRisk = require('../models/BustRisk');
const Alert = require('../models/Alert');
const { levelFromProbability } = require('../services/reliabilityService');

const DEMO = 'DEMONSTRATION DATA';
const TODAY = new Date('2026-09-29T00:00:00.000Z');
let mongod, analyst, researcher;

const login = async (email, password) =>
  (await request(app).post('/api/auth/login').send({ email, password })).body.token;
const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  await User.create({ name: 'A', email: 'analyst@forecastguard.demo', password: 'Analyst@123', role: 'Analyst' });
  await User.create({ name: 'R', email: 'researcher@forecastguard.demo', password: 'Researcher@123', role: 'Researcher' });

  const mh = await Region.create({ name: 'Maharashtra', code: 'maharashtra', lat: 19.7, lon: 75.7, zone: 'West' });
  const kl = await Region.create({ name: 'Kerala', code: 'kerala', lat: 10.5, lon: 76.3, zone: 'South' });

  const risks = [];
  for (const [region, factor] of [[mh, 1.2], [kl, 0.6]]) {
    for (let h = 1; h <= 10; h++) {
      const bust = Math.round(8 * h * factor * 10) / 10;
      risks.push({
        region: region._id, date: TODAY, horizon: h, confidence: Math.round((100 - bust * 0.9) * 10) / 10,
        bustProbability: bust, expectedError: bust / 10, expectedErrorLevel: 'Moderate',
        riskLevel: levelFromProbability(bust),
        contributors: [{ feature: 'Rainfall anomaly', key: 'rainfallAnomaly', contribution: 60, direction: 'increases risk' }],
        events: region === mh ? [{ event: 'Heavy Rainfall', basis: 'Strong positive rainfall anomaly' }] : [],
        inputs: { horizon: h, rainfallAnomaly: 1.5, pressureChange: -1, windChange: 0.5, temperatureAnomaly: 0, historicalMAE: 1.5, humidityInstability: 0.5 },
        modelVersion: 'test-0', source: DEMO,
      });
    }
  }
  await BustRisk.insertMany(risks);

  const fc = [], ob = [], er = [];
  for (let back = 1; back <= 3; back++) {
    const date = new Date(TODAY.getTime() - back * 86400000);
    ob.push({ region: mh._id, date, variable: 'rainfall', observedValue: 10, source: DEMO });
    for (let h = 1; h <= 10; h++) {
      const f = 10 + h * 1.5;
      fc.push({ region: mh._id, date, horizon: h, variable: 'rainfall', forecastValue: f, source: DEMO });
      er.push({ region: mh._id, date, horizon: h, variable: 'rainfall', forecastValue: f, observedValue: 10, absoluteError: h * 1.5, relativeError: h * 15, source: DEMO });
    }
  }
  await Promise.all([Forecast.insertMany(fc), Observation.insertMany(ob), ForecastError.insertMany(er)]);

  await Alert.create({
    region: mh._id, date: TODAY, horizon: 6, severity: 'Critical', message: 'CRITICAL FORECAST UNCERTAINTY',
    reason: 'Rapid rainfall pattern change', bustProbability: 72, source: DEMO,
  });

  analyst = await login('analyst@forecastguard.demo', 'Analyst@123');
  researcher = await login('researcher@forecastguard.demo', 'Researcher@123');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('auth', () => {
  test('login succeeds with demo credentials', () => {
    expect(analyst).toBeTruthy();
  });
  test('wrong password is rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'analyst@forecastguard.demo', password: 'nope-nope' });
    expect(res.status).toBe(401);
  });
  test('/me returns the current user', async () => {
    const res = await request(app).get('/api/auth/me').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('Analyst');
  });
  test('self-registration cannot request Admin', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ name: 'X', email: 'x@example.com', password: 'Password@1', role: 'Admin' });
    expect(res.status).toBe(400);
  });
  test('protected routes require a token', async () => {
    expect((await request(app).get('/api/dashboard/overview')).status).toBe(401);
  });
});

describe('dashboard and risk APIs', () => {
  test('overview returns KPIs and a 10-day trend', async () => {
    const res = await request(app).get('/api/dashboard/overview').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.trend).toHaveLength(10);
    expect(typeof res.body.kpis.overallConfidence).toBe('number');
    expect(res.body.mode).toBe('DEMONSTRATION MODE');
  });
  test('bust-risk list filters by day', async () => {
    const res = await request(app).get('/api/bust-risk?day=6').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });
  test('bust-risk by region returns the D1-D10 curve', async () => {
    const res = await request(app).get('/api/bust-risk/maharashtra?day=6').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.curve).toHaveLength(10);
    expect(res.body.selected.horizon).toBe(6);
  });
});

describe('forecast replay and errors', () => {
  test('replay returns series, horizon profile and stats', async () => {
    const res = await request(app).get('/api/forecasts/maharashtra?variable=rainfall&horizon=3').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.series).toHaveLength(3);
    expect(res.body.horizonProfile).toHaveLength(10);
    expect(res.body.stats.series.mae).toBeCloseTo(4.5, 1);
  });
  test('invalid variable is rejected', async () => {
    const res = await request(app).get('/api/forecasts/maharashtra?variable=snow').set(auth(analyst));
    expect(res.status).toBe(400);
  });
  test('error summary covers 10 horizons', async () => {
    const res = await request(app).get('/api/errors/summary?variable=rainfall').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.byHorizon).toHaveLength(10);
  });
  test('analytics horizon returns confidence-vs-error pairs', async () => {
    const res = await request(app).get('/api/analytics/horizon').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.confidenceVsError).toHaveLength(10);
  });
});

describe('ML-backed endpoints', () => {
  test('model health reports version and quality', async () => {
    const res = await request(app).get('/api/model/health').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.model.version).toBe('test-0');
    expect(['GOOD', 'WARNING', 'CRITICAL']).toContain(res.body.dataQuality);
  });
  test('prediction endpoint returns an assessment', async () => {
    const res = await request(app).post('/api/predictions').set(auth(analyst))
      .send({ horizon: 6, rainfallAnomaly: 2 });
    expect(res.status).toBe(201);
    expect(res.body.result.bustProbability).toBeGreaterThan(0);
  });
  test('prediction validates horizon', async () => {
    const res = await request(app).post('/api/predictions').set(auth(analyst)).send({ horizon: 11 });
    expect(res.status).toBe(400);
  });
  test('simulation returns before/after and the most influential factor', async () => {
    const res = await request(app).post('/api/simulation').set(auth(analyst))
      .send({ horizon: 6, regionId: 'maharashtra', rainfallAnomaly: 2.5, windChange: 1.5 });
    expect(res.status).toBe(200);
    expect(res.body.before).toBeDefined();
    expect(res.body.after).toBeDefined();
    expect(res.body.mostInfluentialFactor.factor).toBeTruthy();
    expect(res.body.mode).toBe('SIMULATION MODE');
  });
});

describe('CSV upload', () => {
  const HEADER = 'date,region,horizon,variable,forecast,observed,rainfall\n';
  const post = (t, csv) => request(app).post('/api/upload/forecast').set(auth(t)).set('Content-Type', 'text/csv').send(csv);

  test('imports valid rows and reports rejected ones', async () => {
    const csv = HEADER +
      '2026-09-20,Maharashtra,3,rainfall,12.5,9.1,10\n' +
      '2026-09-20,Atlantis,3,rainfall,1,2,1\n' +
      '2026-09-21,Kerala,11,temperature,30,31,\n' +
      '2026-09-21,Kerala,2,temperature,abc,31,\n';
    const res = await post(analyst, csv);
    expect(res.status).toBe(201);
    expect(res.body.report.rowsImported).toBe(1);
    expect(res.body.report.rowsRejected).toBe(3);
    expect(res.body.report.rejectionReasons.length).toBeGreaterThan(0);
  });
  test('re-uploading the same file creates no duplicates', async () => {
    const csv = HEADER + '2026-09-22,Kerala,2,temperature,30,31,5\n';
    await post(analyst, csv);
    await post(analyst, csv);
    expect(await ForecastError.countDocuments({ source: 'UPLOADED DATA', variable: 'temperature' })).toBe(1);
  });
  test('missing required columns returns 400 with details', async () => {
    const res = await post(analyst, 'date,region\n2026-09-20,Kerala\n');
    expect(res.status).toBe(400);
    expect(res.body.details.missingColumns).toContain('horizon');
  });
  test('Researcher role cannot upload', async () => {
    expect((await post(researcher, HEADER + '2026-09-20,Kerala,2,rainfall,1,2,1\n')).status).toBe(403);
  });
});

describe('alerts', () => {
  test('lists alerts with counts', async () => {
    const res = await request(app).get('/api/alerts').set(auth(analyst));
    expect(res.status).toBe(200);
    expect(res.body.counts.Critical).toBe(1);
  });
  test('analyst can acknowledge; researcher cannot; bad status rejected', async () => {
    const id = (await request(app).get('/api/alerts').set(auth(analyst))).body.items[0].id;
    expect((await request(app).patch(`/api/alerts/${id}`).set(auth(researcher)).send({ status: 'Acknowledged' })).status).toBe(403);
    expect((await request(app).patch(`/api/alerts/${id}`).set(auth(analyst)).send({ status: 'Bogus' })).status).toBe(400);
    const ok = await request(app).patch(`/api/alerts/${id}`).set(auth(analyst)).send({ status: 'Acknowledged' });
    expect(ok.status).toBe(200);
    expect(ok.body.alert.status).toBe('Acknowledged');
  });
});