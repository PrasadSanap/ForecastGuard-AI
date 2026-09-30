const router = require('express').Router();
const { overview, horizon, regions } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/overview', overview);
router.get('/horizon', horizon);
router.get('/regions', regions);

module.exports = router;