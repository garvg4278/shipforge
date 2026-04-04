// routes/auth.js

const express = require('express');
const router = express.Router();

const { signup, login } = require('../controllers/authController');
const { signupValidation, loginValidation } = require('../utils/validators');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/signup', authLimiter, signupValidation, validate, signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
router.post('/login', authLimiter, loginValidation, validate, login);

module.exports = router;
