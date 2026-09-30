const router = require('express').Router();
const { run } = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { featureRules, num } = require('../utils/validators');

router.post('/', protect, [...featureRules, num('historicalError', 0, 15)], validate, run);

module.exports = router;