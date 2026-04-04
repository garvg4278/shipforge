// routes/shipments.js

const express = require('express');
const router = express.Router();

const {
  createShipment,
  getMyShipments,
  getShipmentById,
} = require('../controllers/shipmentController');

const { requireAuth } = require('../middleware/auth');
const { createShipmentValidation, paginationValidation } = require('../utils/validators');
const validate = require('../middleware/validate');

// All shipment routes require authentication
router.use(requireAuth);

/**
 * @route   POST /api/shipments
 * @desc    Create a new shipment order
 * @access  Private (USER + ADMIN)
 */
router.post('/', createShipmentValidation, validate, createShipment);

/**
 * @route   GET /api/shipments
 * @desc    Get the authenticated user's own shipments (paginated)
 * @access  Private (USER + ADMIN)
 * @query   page, limit, status, deliveryType
 */
router.get('/', paginationValidation, validate, getMyShipments);

/**
 * @route   GET /api/shipments/:id
 * @desc    Get a single shipment by ID (must belong to the authenticated user)
 * @access  Private (USER + ADMIN)
 */
router.get('/:id', getShipmentById);

module.exports = router;
