const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const sign = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, 'Email already registered');
  // Self-registration can never create an Admin.
  const safeRole = ['Analyst', 'Researcher'].includes(role) ? role : 'Researcher';
  const user = await User.create({ name, email, password, role: safeRole });
  res.status(201).json({ success: true, token: sign(user), user: publicUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  res.json({ success: true, token: sign(user), user: publicUser(user) });
});

exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});