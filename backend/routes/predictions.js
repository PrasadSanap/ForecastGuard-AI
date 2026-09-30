const router = require('express').Router();
const { body } = require('express-validator');
const { create, list } = require('../controllers/predictionController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { featureRules } = require('../utils/validators');

router.use(protect);
router.post('/', [...featureRules, body('month').optional().isInt({ min: 1, max: 12 }).toInt()], validate, create);
router.get('/', list);

module.exports = router;