// services/shipmentService.js

const prisma = require('../config/prisma');
const { generateOrderId, calculateShipmentMetrics, getPagination, paginatedResponse } = require('../utils/helpers');
const logger = require('../config/logger');

// Reusable Prisma include — keeps queries consistent
const SHIPMENT_INCLUDE = {
  addresses: {
    select: { id: true, type: true, name: true, address: true, city: true, pincode: true },
    orderBy: { type: 'asc' },
  },
  packages: {
    select: {
      id: true, name: true, weight: true,
      length: true, width: true, height: true, declaredValue: true,
    },
  },
  user: {
    select: { id: true, name: true, email: true },
  },
};

/**
 * Creates a new shipment with addresses and packages in a single transaction.
 */
const createShipment = async (userId, payload) => {
  const { shipmentDate, deliveryType, fragile, insured, sender, receiver, packages } = payload;

  const orderId = await generateOrderId();
  const metrics = calculateShipmentMetrics(packages);

  const shipment = await prisma.$transaction(async (tx) => {
    const created = await tx.shipment.create({
      data: {
        orderId,
        userId,
        shipmentDate: new Date(shipmentDate),
        deliveryType: deliveryType.toUpperCase(),
        fragile: Boolean(fragile),
        insured: Boolean(insured),
        status: 'PENDING',
        addresses: {
          create: [
            {
              type: 'SENDER',
              name: sender.name,
              address: sender.address,
              city: sender.city,
              pincode: sender.pincode,
            },
            {
              type: 'RECEIVER',
              name: receiver.name,
              address: receiver.address,
              city: receiver.city,
              pincode: receiver.pincode,
            },
          ],
        },
        packages: {
          create: packages.map((pkg) => ({
            name: pkg.name,
            weight: parseFloat(pkg.weight),
            length: parseFloat(pkg.length),
            width: parseFloat(pkg.width),
            height: parseFloat(pkg.height),
            declaredValue: parseFloat(pkg.declaredValue),
          })),
        },
      },
      include: SHIPMENT_INCLUDE,
    });
    return created;
  });

  logger.info(`[shipmentService] Shipment created: ${shipment.orderId} by user ${userId}`);

  return formatShipment(shipment, metrics);
};

/**
 * Returns paginated shipments owned by a specific user.
 */
const getUserShipments = async (userId, query) => {
  const { page, limit, skip, take } = getPagination(query);

  const where = buildUserFilter(userId, query);

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: SHIPMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.shipment.count({ where }),
  ]);

  return paginatedResponse(shipments.map((s) => formatShipment(s)), total, page, limit);
};

/**
 * Returns a single shipment. Enforces userId ownership unless admin flag set.
 */
const getShipmentById = async (shipmentId, userId, isAdmin = false) => {
  const where = isAdmin ? { id: shipmentId } : { id: shipmentId, userId };

  const shipment = await prisma.shipment.findFirst({
    where,
    include: SHIPMENT_INCLUDE,
  });

  if (!shipment) {
    const err = new Error('Shipment not found');
    err.statusCode = 404;
    throw err;
  }

  return formatShipment(shipment);
};

/**
 * Returns paginated shipments for all users (admin only).
 */
const getAllShipments = async (query) => {
  const { page, limit, skip, take } = getPagination(query);

  const where = buildAdminFilter(query);

  const [shipments, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: SHIPMENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.shipment.count({ where }),
  ]);

  return paginatedResponse(shipments.map((s) => formatShipment(s)), total, page, limit);
};

/**
 * Updates shipment status (admin only).
 */
const updateShipmentStatus = async (shipmentId, status) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) {
    const err = new Error('Shipment not found');
    err.statusCode = 404;
    throw err;
  }

  // Guard: can't re-open a delivered or cancelled shipment
  if (['DELIVERED', 'CANCELLED'].includes(shipment.status)) {
    const err = new Error(`Cannot update a shipment that is already ${shipment.status}`);
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.shipment.update({
    where: { id: shipmentId },
    data: { status },
    include: SHIPMENT_INCLUDE,
  });

  logger.info(`[shipmentService] Shipment ${updated.orderId} status → ${status}`);
  return formatShipment(updated);
};

/**
 * Hard-deletes a shipment and all related data via cascade (admin only).
 */
const deleteShipment = async (shipmentId) => {
  const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
  if (!shipment) {
    const err = new Error('Shipment not found');
    err.statusCode = 404;
    throw err;
  }

  await prisma.shipment.delete({ where: { id: shipmentId } });
  logger.info(`[shipmentService] Shipment deleted: ${shipment.orderId}`);
  return { orderId: shipment.orderId };
};

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Enriches a raw Prisma shipment with computed metrics.
 */
const formatShipment = (shipment, metrics = null) => {
  const computed = metrics || calculateShipmentMetrics(shipment.packages || []);
  return {
    ...shipment,
    sender: shipment.addresses?.find((a) => a.type === 'SENDER') || null,
    receiver: shipment.addresses?.find((a) => a.type === 'RECEIVER') || null,
    totalPackages: computed.totalPackages,
    totalWeight: computed.totalWeight,
    totalDeclaredValue: computed.totalDeclaredValue,
  };
};

/**
 * Builds WHERE clause for user-scoped shipment queries with optional filters.
 */
const buildUserFilter = (userId, query) => {
  const where = { userId };
  if (query.status) where.status = query.status.toUpperCase();
  if (query.deliveryType) where.deliveryType = query.deliveryType.toUpperCase();
  return where;
};

/**
 * Builds WHERE clause for admin-scoped shipment queries with optional filters.
 */
const buildAdminFilter = (query) => {
  const where = {};
  if (query.status) where.status = query.status.toUpperCase();
  if (query.deliveryType) where.deliveryType = query.deliveryType.toUpperCase();
  if (query.userId) where.userId = query.userId;
  if (query.search) {
    where.OR = [
      { orderId: { contains: query.search, mode: 'insensitive' } },
      { user: { name: { contains: query.search, mode: 'insensitive' } } },
      { user: { email: { contains: query.search, mode: 'insensitive' } } },
    ];
  }
  return where;
};

module.exports = {
  createShipment,
  getUserShipments,
  getShipmentById,
  getAllShipments,
  updateShipmentStatus,
  deleteShipment,
};
