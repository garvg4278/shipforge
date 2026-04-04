// server.js
// Application entry point. Starts HTTP server with graceful shutdown handling.

require('./config/env'); // validate env vars before anything else

const app = require('./app');
const prisma = require('./config/prisma');
const logger = require('./config/logger');
const { PORT, NODE_ENV } = require('./config/env');

let server;

const start = async () => {
  try {
    // Verify database connection before accepting traffic
    await prisma.$connect();
    logger.info('[server] Database connection established');

    server = app.listen(PORT, () => {
      logger.info(`[server] ShipForge API running on port ${PORT} [${NODE_ENV}]`);
      logger.info(`[server] Health: http://localhost:${PORT}/api/health`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        logger.error(`[server] Port ${PORT} is already in use`);
      } else {
        logger.error(`[server] Server error: ${err.message}`);
      }
      process.exit(1);
    });
  } catch (err) {
    logger.error(`[server] Failed to start: ${err.message}`);
    process.exit(1);
  }
};

// ── Graceful shutdown ─────────────────────────────────────────────────────────

const shutdown = async (signal) => {
  logger.info(`[server] ${signal} received — starting graceful shutdown`);

  if (server) {
    server.close(async () => {
      logger.info('[server] HTTP server closed — no new connections accepted');

      try {
        await prisma.$disconnect();
        logger.info('[server] Database connection closed');
      } catch (err) {
        logger.error(`[server] Error disconnecting database: ${err.message}`);
      }

      logger.info('[server] Shutdown complete');
      process.exit(0);
    });

    // Force shutdown if graceful close takes too long
    setTimeout(() => {
      logger.error('[server] Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop / Kubernetes
process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C in dev

// Catch unhandled promise rejections — log and exit (don't silently swallow)
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[server] Unhandled rejection:', { reason, promise });
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error(`[server] Uncaught exception: ${err.message}`, { stack: err.stack });
  shutdown('uncaughtException');
});

start();
