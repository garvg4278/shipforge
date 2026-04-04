// controllers/shipmentController.js

const shipmentService = require('../services/shipmentService');
const { success, created, notFound } = require('../utils/apiResponse');

/**
 * POST /api/shipments
 * Creates a new shipment for the authenticated user.
 */
const createShipment = async (req, res, next) => {
  try {
    const shipment = await shipmentService.createShipment(req.user.id, req.body);
    return created(res, shipment, 'Shipment created successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shipments
 * Returns paginated list of the authenticated user's own shipments.
 * Supports: ?page=1&limit=20&status=PENDING&deliveryType=EXPRESS
 */
const getMyShipments = async (req, res, next) => {
  try {
    const result = await shipmentService.getUserShipments(req.user.id, req.query);
    return success(res, result, 'Shipments retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/shipments/:id
 * Returns a single shipment owned by the authenticated user.
 */
const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await shipmentService.getShipmentById(req.params.id, req.user.id, false);
    return success(res, shipment, 'Shipment retrieved');
  } catch (err) {
    next(err);
  }
};

module.exports = { createShipment, getMyShipments, getShipmentById };
