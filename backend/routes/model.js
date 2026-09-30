const router = require('express').Router();
const { health } = require('../controllers/modelController');
const { protect } = require('../middleware/auth');

router.get('/health', protect, health);

module.exports = router;