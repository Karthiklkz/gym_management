require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not defined!");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const defaultPassword = 'SuperAdmin@123';
  const defaultHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Reset password of any existing super@admin.com to SuperAdmin@123 so the user can log in
  const existingSuper = await prisma.user.findFirst({
    where: { email: 'super@admin.com' }
  });

  if (existingSuper) {
    await prisma.user.update({
      where: { id: existingSuper.id },
      data: {
        passwordHash: defaultHash,
        status: 'ACTIVE'
      }
    });
    console.log(`\n[SUCCESS]: Updated password for existing Super Admin 'super@admin.com' to 'SuperAdmin@123'.`);
  }

  // 2. Also register superadmin@peakpulse.com with SuperAdmin@123 so the user has two options
  const anotherSuper = await prisma.user.findFirst({
    where: { email: 'superadmin@peakpulse.com' }
  });

  if (!anotherSuper) {
    const newSuper = await prisma.user.create({
      data: {
        email: 'superadmin@peakpulse.com',
        passwordHash: defaultHash,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'Alex',
            lastName: 'Admin'
          }
        }
      }
    });
    console.log(`[SUCCESS]: Created a new Super Admin 'superadmin@peakpulse.com' with password 'SuperAdmin@123'.`);
  } else {
    await prisma.user.update({
      where: { id: anotherSuper.id },
      data: {
        passwordHash: defaultHash,
        status: 'ACTIVE'
      }
    });
    console.log(`[SUCCESS]: Updated password for 'superadmin@peakpulse.com' to 'SuperAdmin@123'.`);
  }
  
  console.log(`\n--- Active Super Admin Credentials ---`);
  console.log(`Option 1:`);
  console.log(`  Email: super@admin.com`);
  console.log(`  Password: SuperAdmin@123`);
  console.log(`Option 2:`);
  console.log(`  Email: superadmin@peakpulse.com`);
  console.log(`  Password: SuperAdmin@123`);
  console.log(`--------------------------------------\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
