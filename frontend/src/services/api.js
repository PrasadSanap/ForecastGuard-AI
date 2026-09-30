import axios from 'axios';

export const TOKEN_KEY = 'fg_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = (err.config && err.config.url) || '';
    if (err.response && err.response.status === 401 && !url.includes('/auth/login')) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('fg:unauthorized'));
    }
    return Promise.reject(err);
  },
);

export const errMsg = (e) =>
  (e.response && e.response.data && e.response.data.message) || e.message || 'Request failed';

const get = (url, params) => api.get(url, { params }).then((r) => r.data);
const post = (url, body) => api.post(url, body).then((r) => r.data);

export const healthApi = () => api.get('/health').then((r) => r.data);
export const authApi = {
  login: (email, password) => post('/auth/login', { email, password }),
  me: () => get('/auth/me'),
};
export const dashboardApi = { overview: () => get('/dashboard/overview') };
export const regionsApi = { list: () => get('/regions'), get: (id) => get(`/regions/${id}`) };
export const riskApi = {
  list: (p) => get('/bust-risk', p),
  region: (id, p) => get(`/bust-risk/${id}`, p),
};
export const forecastApi = { list: (p) => get('/forecasts', p), replay: (id, p) => get(`/forecasts/${id}`, p) };
export const observationApi = { list: (p) => get('/observations', p) };
export const errorApi = { list: (p) => get('/errors', p), summary: (p) => get('/errors/summary', p) };
export const predictionApi = { create: (b) => post('/predictions', b), list: () => get('/predictions') };
export const simulationApi = { run: (b) => post('/simulation', b) };
export const alertApi = {
  list: (p) => get('/alerts', p),
  update: (id, status) => api.patch(`/alerts/${id}`, { status }).then((r) => r.data),
};
export const analyticsApi = {
  overview: (p) => get('/analytics/overview', p),
  horizon: (p) => get('/analytics/horizon', p),
  regions: (p) => get('/analytics/regions', p),
};
export const modelApi = { health: () => get('/model/health') };
export const uploadApi = {
  forecast: (csv) => api.post('/upload/forecast', csv, { headers: { 'Content-Type': 'text/csv' } }).then((r) => r.data),
  template: () => api.get('/upload/template', { responseType: 'blob' }).then((r) => r.data),
};