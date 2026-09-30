const router = require('express').Router();
const { list, getOne } = require('../controllers/regionController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', list);
router.get('/:id', getOne);

module.exports = router;