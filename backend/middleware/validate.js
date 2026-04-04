// middleware/validate.js
// Reads express-validator results and returns a structured 400 if any fail.

const { validationResult } = require('express-validator');
const { badRequest } = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return badRequest(res, 'Validation failed', errors);
  }
  next();
};

module.exports = validate;
