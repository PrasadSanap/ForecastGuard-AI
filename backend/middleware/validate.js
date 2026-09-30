const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  next(new ApiError(400, 'Validation failed',
    errors.array().map((e) => ({ field: e.path, message: e.msg }))));
};