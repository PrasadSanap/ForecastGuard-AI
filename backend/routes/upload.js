const router = require('express').Router();
const express = require('express');
const { uploadForecast, template } = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/template', template);
// Raw CSV body (text/csv). JSON { csv } is also accepted by the global JSON parser.
router.post('/forecast', authorize('Analyst', 'Admin'),
  express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }), uploadForecast);

module.exports = router;