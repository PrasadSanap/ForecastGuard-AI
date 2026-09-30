require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const ml = require('./services/mlClient');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(','), credentials: true }));
app.use(express.json({ limit: '5mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  let mlStatus = 'down';
  try { await ml.health(); mlStatus = 'ok'; } catch (e) { /* reported below */ }
  res.json({
    status: 'ok', mode: 'DEMONSTRATION MODE',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mlService: mlStatus,
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/forecasts', require('./routes/forecasts'));
app.use('/api/observations', require('./routes/observations'));
app.use('/api/errors', require('./routes/errors'));
app.use('/api/bust-risk', require('./routes/bustRisk'));
app.use('/api/predictions', require('./routes/predictions'));
app.use('/api/simulation', require('./routes/simulation'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/model', require('./routes/model'));
app.use('/api/upload', require('./routes/upload'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;