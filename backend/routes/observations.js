const router = require('express').Router();
const { list } = require('../controllers/observationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, list);

module.exports = router;