// middleware/errorHandler.js
// Catches any error thrown/passed via next(err) in the entire app.

const logger = require('../config/logger');
const { NODE_ENV } = require('../config/env');

const errorHandler = (err, req, res, next) => {
  // Log full error server-side
  logger.error(`[errorHandler] ${req.method} ${req.path} — ${err.message}`, {
    stack: err.stack,
    body: req.body,
    user: req.user?.id,
  });

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with that value already exists',
      timestamp: new Date().toISOString(),
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
      timestamp: new Date().toISOString(),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }

  // SyntaxError from bad JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON in request body',
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback 500
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
