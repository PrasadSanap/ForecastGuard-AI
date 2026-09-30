const router = require('express').Router();
const { list, replay } = require('../controllers/forecastController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', list);
router.get('/:regionId', replay);

module.exports = router;