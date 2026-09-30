const { body } = require('express-validator');

const num = (field, min, max) =>
  body(field).optional().isFloat({ min, max })
    .withMessage(`${field} must be a number between ${min} and ${max}`).toFloat();

const featureRules = [
  body('horizon').isInt({ min: 1, max: 10 }).withMessage('horizon must be an integer 1-10').toInt(),
  num('rainfallAnomaly', -5, 5),
  num('pressureChange', -5, 5),
  num('windChange', -5, 5),
  num('temperatureAnomaly', -5, 5),
  num('historicalMAE', 0, 15),
  num('humidityInstability', 0, 5),
];

module.exports = { featureRules, num };