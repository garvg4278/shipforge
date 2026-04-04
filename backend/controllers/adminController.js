// controllers/adminController.js

const shipmentService = require('../services/shipmentService');
const authService = require('../services/authService');
const { success, created } = require('../utils/apiResponse');

/**
 * GET /api/admin/shipments
 * Returns all shipments across all users with pagination + filters.
 * Supports: ?page=1&limit=20&status=PENDING&deliveryType=EXPRESS&userId=xxx&search=LGX
 */
const getAllShipments = async (req, res, next) => {
  try {
    const result = await shipmentService.getAllShipments(req.query);
    return success(res, result, 'All shipments retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/shipments/:id
 * Returns any single shipment regardless of owner.
 */
const getShipmentById = async (req, res, next) => {
  try {
    const shipment = await shipmentService.getShipmentById(req.params.id, null, true);
    return success(res, shipment, 'Shipment retrieved');
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/shipments/:id/status
 * Updates the status of any shipment.
 * Body: { status: "SHIPPED" }
 */
const updateShipmentStatus = async (req, res, next) => {
  try {
    const shipment = await shipmentService.updateShipmentStatus(req.params.id, req.body.status);
    return success(res, shipment, `Shipment status updated to ${req.body.status}`);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/shipments/:id
 * Hard-deletes a shipment and all cascaded data.
 */
const deleteShipment = async (req, res, next) => {
  try {
    const result = await shipmentService.deleteShipment(req.params.id);
    return success(res, result, 'Shipment deleted successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/create-admin
 * Creates a new ADMIN account. Only callable by an existing ADMIN.
 */
const createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const admin = await authService.createAdmin({ name, email, password }, req.user);
    return created(res, admin, 'Admin account created successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllShipments,
  getShipmentById,
  updateShipmentStatus,
  deleteShipment,
  createAdmin,
};
