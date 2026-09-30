const router = require('express').Router();
const { list, getRegion } = require('../controllers/bustController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', list);
router.get('/:regionId', getRegion);

module.exports = router;