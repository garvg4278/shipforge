// middleware/rateLimiter.js

const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, AUTH_RATE_LIMIT_MAX } = require('../config/env');

const rateLimitResponse = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests — please slow down and try again later',
    timestamp: new Date().toISOString(),
  });
};

/**
 * General API rate limiter — applied globally
 */
const globalLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

/**
 * Strict limiter for auth endpoints — prevents brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
  skipSuccessfulRequests: true, // only counts failed attempts
});

module.exports = { globalLimiter, authLimiter };
