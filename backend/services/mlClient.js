const axios = require('axios');
const ApiError = require('../utils/ApiError');

const http = axios.create({
  baseURL: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  timeout: 20000,
});

async function call(method, url, data) {
  try {
    const res = await http.request({ method, url, data });
    return res.data;
  } catch (err) {
    const detail = err.response
      ? `ML service error ${err.response.status}`
      : 'ML service unavailable';

    throw new ApiError(503, detail);
  }
}

module.exports = {
  health: () => call('get', '/health'),
  modelHealth: () => call('get', '/model/health'),
  predictBust: (f) => call('post', '/predict/bust-risk', f),
  predictError: (f) => call('post', '/predict/error', f),
  predictConfidence: (f) => call('post', '/predict/confidence', f),
  explain: (f) => call('post', '/explain', f),
  simulate: (baseline, scenario) =>
    call('post', '/simulate', { baseline, scenario }),
  detectEvent: (e) => call('post', '/detect-event', e),
};