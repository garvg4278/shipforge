// controllers/authController.js

const authService = require('../services/authService');
const { success, created, serverError } = require('../utils/apiResponse');
const { sanitizeUser } = require('../utils/helpers');

/**
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.signup({ name, email, password });
    return created(res, result, 'Account created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    return success(res, result, 'Logged in successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login };
