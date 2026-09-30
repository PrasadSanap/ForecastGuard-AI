const router = require('express').Router();
const { list, summary } = require('../controllers/errorController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', summary);
router.get('/', list);

module.exports = router;