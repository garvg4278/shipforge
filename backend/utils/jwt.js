// utils/jwt.js

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Signs a JWT with user payload.
 */
const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'shipforge-api',
    audience: 'shipforge-client',
  });
};

/**
 * Verifies a JWT and returns decoded payload.
 * Throws if invalid or expired.
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'shipforge-api',
    audience: 'shipforge-client',
  });
};

/**
 * Extracts token from Authorization header.
 * Supports: "Bearer <token>"
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
};

module.exports = { signToken, verifyToken, extractToken };
