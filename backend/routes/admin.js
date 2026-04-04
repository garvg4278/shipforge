// routes/admin.js

const express = require('express');
const router = express.Router();

const {
  getAllShipments,
  getShipmentById,
  updateShipmentStatus,
  deleteShipment,
  createAdmin,
} = require('../controllers/adminController');

const { requireAuth, requireAdmin } = require('../middleware/auth');
const {
  updateStatusValidation,
  createAdminValidation,
  paginationValidation,
} = require('../utils/validators');
const validate = require('../middleware/validate');

// All admin routes require auth + admin role
router.use(requireAuth, requireAdmin);

/**
 * @route   GET /api/admin/shipments
 * @desc    Get ALL shipments across all users with pagination and filtering
 * @access  Admin only
 * @query   page, limit, status, deliveryType, userId, search
 */
router.get('/shipments', paginationValidation, validate, getAllShipments);

/**
 * @route   GET /api/admin/shipments/:id
 * @desc    Get any single shipment by ID
 * @access  Admin only
 */
router.get('/shipments/:id', getShipmentById);

/**
 * @route   PATCH /api/admin/shipments/:id/status
 * @desc    Update shipment status
 * @access  Admin only
 * @body    { status: "SHIPPED" }
 */
router.patch('/shipments/:id/status', updateStatusValidation, validate, updateShipmentStatus);

/**
 * @route   DELETE /api/admin/shipments/:id
 * @desc    Hard-delete a shipment and all its related data
 * @access  Admin only
 */
router.delete('/shipments/:id', deleteShipment);

/**
 * @route   POST /api/admin/create-admin
 * @desc    Create a new admin account (only existing admins can do this)
 * @access  Admin only
 */
router.post('/create-admin', createAdminValidation, validate, createAdmin);

module.exports = router;
