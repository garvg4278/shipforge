// routes/index.js
// Single registration point for all API routes.

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const userRoutes = require('./user');
const shipmentRoutes = require('./shipments');
const adminRoutes = require('./admin');

// Health check — no auth required, useful for load balancer / Docker healthcheck
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'shipforge-api',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
