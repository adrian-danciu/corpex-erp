import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

// Debug: Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in environment variables');
  console.error('Make sure .env file exists and contains DATABASE_URL');
  process.exit(1);
}

console.log('✅ DATABASE_URL loaded successfully');

// Create connection with standard pg driver
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Testing database connection...\n');

  // Test 1: Create a user
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: 'test123',
      role: 'EMPLOYEE',
    },
  });
  console.log('✅ Created user:', user);

  // Test 2: Read users
  const users = await prisma.user.findMany();
  console.log('✅ Found users:', users.length);

  // Test 3: Update user
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'MANAGER' },
  });
  console.log('✅ Updated user role:', updated.role);

  // Test 4: Delete user
  await prisma.user.delete({
    where: { id: user.id },
  });
  console.log('✅ Deleted test user');

  console.log('\n🎉 All database operations successful!');
}

main()
  .catch((e) => {
    console.error('❌ Database connection failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
