const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  let details = err.details;

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401; message = 'Invalid or expired token';
  } else if (err.name === 'CastError') {
    status = 400; message = `Invalid ${err.path}`;
  } else if (err.name === 'ValidationError' && err.errors) {
    status = 400; message = 'Validation failed';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.code === 11000) {
    status = 409; message = 'Duplicate value';
  }

  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error(err);
  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
};

module.exports = { notFound, errorHandler };