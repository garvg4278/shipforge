// app.js
// Express application factory — separated from server.js so it can be tested in isolation.

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { NODE_ENV, CORS_ORIGIN } = require('./config/env');
const logger = require('./config/logger');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes/index');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      const allowed = CORS_ORIGIN.split(',').map((o) => o.trim());
      if (allowed.includes(origin) || allowed.includes('*')) {
        return callback(null, true);
      }
      logger.warn(`[CORS] Blocked request from origin: ${origin}`);
      return callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Request logging ───────────────────────────────────────────────────────────
const morganFormat = NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.path === '/api/health', // don't log health checks
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Global rate limiting ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Trust proxy (required for rate limiting behind Nginx/load balancer) ───────
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 handler (must be after all routes) ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
