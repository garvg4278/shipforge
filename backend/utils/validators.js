// utils/validators.js

const { body, param, query } = require('express-validator');

// ── Auth ─────────────────────────────────────────────────────────────────────

const signupValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Shipment ──────────────────────────────────────────────────────────────────

const addressSchema = (prefix) => [
  body(`${prefix}.name`)
    .trim().notEmpty().withMessage(`${prefix} name is required`)
    .isLength({ max: 200 }).withMessage(`${prefix} name too long`),

  body(`${prefix}.address`)
    .trim().notEmpty().withMessage(`${prefix} address is required`)
    .isLength({ max: 500 }).withMessage(`${prefix} address too long`),

  body(`${prefix}.city`)
    .trim().notEmpty().withMessage(`${prefix} city is required`)
    .isLength({ max: 100 }).withMessage(`${prefix} city too long`),

  body(`${prefix}.pincode`)
    .trim().notEmpty().withMessage(`${prefix} pincode is required`)
    .matches(/^[1-9][0-9]{5}$/).withMessage(`${prefix} pincode must be a valid 6-digit Indian pincode`),
];

const createShipmentValidation = [
  body('shipmentDate')
    .notEmpty().withMessage('Shipment date is required')
    .isISO8601().withMessage('Shipment date must be a valid date'),

  body('deliveryType')
    .notEmpty().withMessage('Delivery type is required')
    .isIn(['STANDARD', 'EXPRESS']).withMessage('Delivery type must be STANDARD or EXPRESS'),

  body('fragile')
    .optional()
    .isBoolean().withMessage('fragile must be a boolean'),

  body('insured')
    .optional()
    .isBoolean().withMessage('insured must be a boolean'),

  ...addressSchema('sender'),
  ...addressSchema('receiver'),

  body('packages')
    .isArray({ min: 1 }).withMessage('At least one package is required'),

  body('packages.*.name')
    .trim().notEmpty().withMessage('Package name is required')
    .isLength({ max: 200 }).withMessage('Package name too long'),

  body('packages.*.weight')
    .notEmpty().withMessage('Package weight is required')
    .isFloat({ min: 0.01 }).withMessage('Weight must be greater than 0'),

  body('packages.*.length')
    .notEmpty().withMessage('Package length is required')
    .isFloat({ min: 0.01 }).withMessage('Length must be greater than 0'),

  body('packages.*.width')
    .notEmpty().withMessage('Package width is required')
    .isFloat({ min: 0.01 }).withMessage('Width must be greater than 0'),

  body('packages.*.height')
    .notEmpty().withMessage('Package height is required')
    .isFloat({ min: 0.01 }).withMessage('Height must be greater than 0'),

  body('packages.*.declaredValue')
    .notEmpty().withMessage('Declared value is required')
    .isFloat({ min: 0 }).withMessage('Declared value must be 0 or greater'),
];

const updateStatusValidation = [
  param('id').notEmpty().withMessage('Shipment ID is required'),

  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'])
    .withMessage('Invalid shipment status'),
];

const createAdminValidation = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
];

const paginationValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
];

module.exports = {
  signupValidation,
  loginValidation,
  createShipmentValidation,
  updateStatusValidation,
  createAdminValidation,
  paginationValidation,
};
