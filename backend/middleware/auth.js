// middleware/auth.js

const { verifyToken, extractToken } = require('../utils/jwt');
const { unauthorized, forbidden } = require('../utils/apiResponse');
const prisma = require('../config/prisma');
const logger = require('../config/logger');

/**
 * requireAuth
 * Verifies JWT, loads user from DB, attaches to req.user.
 * Rejects if token is missing, invalid, expired, or user no longer exists.
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return unauthorized(res, 'Authentication token required');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorized(res, 'Token has expired — please log in again');
      }
      return unauthorized(res, 'Invalid authentication token');
    }

    // Fresh DB check — ensures deleted/suspended accounts are rejected
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return unauthorized(res, 'User account not found');
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error(`[requireAuth] Unexpected error: ${err.message}`);
    return unauthorized(res, 'Authentication failed');
  }
};

/**
 * requireAdmin
 * Must be used AFTER requireAuth.
 * Rejects if authenticated user is not an ADMIN.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return unauthorized(res, 'Not authenticated');
  }
  if (req.user.role !== 'ADMIN') {
    logger.warn(`[requireAdmin] Forbidden: user ${req.user.id} (${req.user.role}) attempted admin action`);
    return forbidden(res, 'Admin access required');
  }
  next();
};

module.exports = { requireAuth, requireAdmin };
