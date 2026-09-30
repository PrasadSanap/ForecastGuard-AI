const router = require('express').Router();
const { body } = require('express-validator');
const { list, update } = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(protect);
router.get('/', list);
// Researchers have read-only access to alerts.
router.patch('/:id', authorize('Analyst', 'Admin'),
  [body('status').isIn(['Acknowledged', 'Resolved']).withMessage('status must be Acknowledged or Resolved')],
  validate, update);

module.exports = router;