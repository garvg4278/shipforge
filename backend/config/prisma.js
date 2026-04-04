// config/prisma.js
// Singleton Prisma client — prevents multiple connections in dev (hot reload).

const { PrismaClient } = require('@prisma/client');
const { NODE_ENV } = require('./env');

const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });

if (NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
