const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'test' ? 1000 : 60 });

router.post('/register', limiter, [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('password must be at least 8 characters'),
  body('role').optional().isIn(['Analyst', 'Researcher']).withMessage('role must be Analyst or Researcher'),
], validate, register);

router.post('/login', limiter, [
  body('email').isEmail().withMessage('valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('password required'),
], validate, login);

router.get('/me', protect, me);

module.exports = router;