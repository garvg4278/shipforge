// services/authService.js

const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');
const { sanitizeUser } = require('../utils/helpers');
const { BCRYPT_ROUNDS } = require('../config/env');
const logger = require('../config/logger');

/**
 * Registers a new USER.
 * Throws on duplicate email.
 */
const signup = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: 'USER' },
  });

  logger.info(`[authService] New user registered: ${user.email} (${user.id})`);

  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return { user: sanitizeUser(user), token };
};

/**
 * Authenticates a user by email + password.
 * Returns the same shape as signup for consistency.
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Constant-time comparison to prevent timing attacks (always compare even if user not found)
  const dummyHash = '$2a$12$dummyhashfortimingattackprevention00000000000000000000';
  const hashToCompare = user ? user.password : dummyHash;
  const passwordMatch = await bcrypt.compare(password, hashToCompare);

  if (!user || !passwordMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  logger.info(`[authService] User logged in: ${user.email} (${user.id})`);

  const token = signToken({ sub: user.id, role: user.role, email: user.email });
  return { user: sanitizeUser(user), token };
};

/**
 * Creates an ADMIN account. Only callable by an existing ADMIN.
 */
const createAdmin = async ({ name, email, password }, createdBy) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const admin = await prisma.user.create({
    data: { name, email, password: hashed, role: 'ADMIN' },
  });

  logger.info(`[authService] Admin created: ${admin.email} by ${createdBy.email}`);

  return sanitizeUser(admin);
};

module.exports = { signup, login, createAdmin };
