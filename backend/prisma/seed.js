// prisma/seed.js
// Run: npm run db:seed
// Creates a default admin account for first-time setup.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@shipforge.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123!';

  const exists = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (exists) {
    console.log(`[seed] Admin already exists: ${adminEmail}`);
    return;
  }

  const hashed = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      name: 'ShipForge Admin',
      email: adminEmail,
      password: hashed,
      role: 'ADMIN',
    },
  });

  console.log(`[seed] Admin created: ${admin.email} (id: ${admin.id})`);
  console.log(`[seed] Password: ${adminPassword}`);
  console.log('[seed] IMPORTANT: Change the admin password after first login.');
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
