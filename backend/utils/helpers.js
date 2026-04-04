// utils/helpers.js

const prisma = require('../config/prisma');

/**
 * Generates a unique logistics order ID in format: LGX-XXXXXXXX
 * Retries up to 5 times on collision (astronomically unlikely).
 */
const generateOrderId = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `LGX-${timestamp}-${random}`;

    const exists = await prisma.shipment.findUnique({ where: { orderId } });
    if (!exists) return orderId;
  }
  throw new Error('Failed to generate unique order ID after maximum retries');
};

/**
 * Calculates shipment summary metrics from a packages array.
 */
const calculateShipmentMetrics = (packages) => {
  const totalPackages = packages.length;
  const totalWeight = packages.reduce((sum, p) => sum + (parseFloat(p.weight) || 0), 0);
  const totalDeclaredValue = packages.reduce((sum, p) => sum + (parseFloat(p.declaredValue) || 0), 0);

  return {
    totalPackages,
    totalWeight: parseFloat(totalWeight.toFixed(3)),
    totalDeclaredValue: parseFloat(totalDeclaredValue.toFixed(2)),
  };
};

/**
 * Strips sensitive fields from a user object before sending in response.
 */
const sanitizeUser = (user) => {
  const { password, ...safe } = user;
  return safe;
};

/**
 * Builds a Prisma pagination object from query params.
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip, take: limit };
};

/**
 * Formats a paginated response with metadata.
 */
const paginatedResponse = (data, total, page, limit) => ({
  items: data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});

module.exports = {
  generateOrderId,
  calculateShipmentMetrics,
  sanitizeUser,
  getPagination,
  paginatedResponse,
};
