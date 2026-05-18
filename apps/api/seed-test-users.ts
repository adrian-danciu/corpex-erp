/**
 * Comprehensive test-data seeding for Corpex ERP.
 *
 * Creates one user per department so you can log in as each and verify
 * permission scopes + the notifications recipient resolution. ADMIN
 * (admin@corpex.com) is NOT touched — it stays as the platform-superuser
 * account, separate from any business role.
 *
 * Idempotent: safe to re-run. Existing rows are upserted.
 *
 * Run from apps/api/:
 *   bunx ts-node seed-test-users.ts
 *
 * After running, all created users have password `password123`.
 */
import {
  PrismaClient,
  Role,
  Department,
  ContractType,
  DocumentType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface Spec {
  email: string;
  firstName: string;
  lastName: string;
  personalId: string;
  department: Department;
  position: string;
  managerEmail?: string; // resolved later
  salary: number;
}

const SPECS: Spec[] = [
  {
    email: 'manager@corpex.com',
    firstName: 'Andrei',
    lastName: 'Ionescu',
    personalId: '1850101400001',
    department: Department.MANAGEMENT,
    position: 'General Manager',
    salary: 8000,
  },
  {
    email: 'hr@corpex.com',
    firstName: 'Maria',
    lastName: 'Popescu',
    personalId: '2860202400002',
    department: Department.HR,
    position: 'HR Specialist',
    managerEmail: 'manager@corpex.com',
    salary: 3200,
  },
  {
    email: 'finance@corpex.com',
    firstName: 'Cristina',
    lastName: 'Stoica',
    personalId: '2870303400003',
    department: Department.FINANCE,
    position: 'Senior Accountant',
    managerEmail: 'manager@corpex.com',
    salary: 4200,
  },
  {
    email: 'warehouse@corpex.com',
    firstName: 'Vlad',
    lastName: 'Munteanu',
    personalId: '1880404400004',
    department: Department.WAREHOUSE,
    position: 'Warehouse Lead',
    managerEmail: 'manager@corpex.com',
    salary: 3000,
  },
  {
    email: 'fleet@corpex.com',
    firstName: 'Radu',
    lastName: 'Dumitrescu',
    personalId: '1890505400005',
    department: Department.FLEET,
    position: 'Fleet Coordinator',
    managerEmail: 'manager@corpex.com',
    salary: 3300,
  },
  {
    email: 'employee@corpex.com',
    firstName: 'Alexandru',
    lastName: 'Stanescu',
    personalId: '1950606400006',
    department: Department.IT,
    position: 'Software Engineer',
    managerEmail: 'manager@corpex.com',
    salary: 5000,
  },
];

async function ensureUserAndEmployee(spec: Spec, hashedPassword: string) {
  const user = await prisma.user.upsert({
    where: { email: spec.email },
    update: {
      firstName: spec.firstName,
      lastName: spec.lastName,
      // Always reset to the test password so the script is reliably idempotent
      // and re-running guarantees the documented login works.
      password: hashedPassword,
    },
    create: {
      email: spec.email,
      password: hashedPassword,
      firstName: spec.firstName,
      lastName: spec.lastName,
      role: Role.USER,
    },
  });

  // Find existing employee row (by userId or personalId — either may collide)
  const existingByUser = await prisma.employee.findUnique({
    where: { userId: user.id },
  });
  const existingByPersonalId = await prisma.employee.findUnique({
    where: { personalId: spec.personalId },
  });

  const target = existingByUser ?? existingByPersonalId;

  const baseData = {
    firstName: spec.firstName,
    lastName: spec.lastName,
    personalId: spec.personalId,
    dateOfBirth: new Date('1990-01-01'),
    phoneNumber: '+40 700 000 000',
    address: 'Str. Test nr. 1',
    city: 'Bucuresti',
    country: 'Romania',
    position: spec.position,
    department: spec.department,
    contractType: ContractType.FULL_TIME,
    employmentDate: new Date('2024-01-15'),
    isContractor: false,
    salary: spec.salary,
    annualLeaveDays: 21,
    remainingLeave: 21,
  };

  if (target) {
    return prisma.employee.update({
      where: { id: target.id },
      data: { ...baseData, userId: user.id },
    });
  }

  return prisma.employee.create({
    data: { ...baseData, userId: user.id },
  });
}

async function linkManagers() {
  for (const spec of SPECS) {
    if (!spec.managerEmail) continue;
    const subordinateUser = await prisma.user.findUnique({
      where: { email: spec.email },
      include: { employee: true },
    });
    const managerUser = await prisma.user.findUnique({
      where: { email: spec.managerEmail },
      include: { employee: true },
    });
    if (!subordinateUser?.employee || !managerUser?.employee) continue;
    await prisma.employee.update({
      where: { id: subordinateUser.employee.id },
      data: { managerId: managerUser.employee.id },
    });
  }
}

async function seedExpiringDocument() {
  const vehicle = await prisma.vehicle.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!vehicle) {
    return { ok: false as const, reason: 'No vehicle in DB — skipping' };
  }

  // Insert if there isn't already one expiring soon for this vehicle
  const tenDaysOut = new Date();
  tenDaysOut.setDate(tenDaysOut.getDate() + 10);

  const existing = await prisma.vehicleDocument.findFirst({
    where: {
      vehicleId: vehicle.id,
      type: DocumentType.ITP,
      expiryDate: { lte: tenDaysOut },
    },
  });

  if (existing) {
    return {
      ok: true as const,
      vehicle: vehicle.plateNumber,
      doc: 'ITP (already had one expiring soon)',
    };
  }

  await prisma.vehicleDocument.create({
    data: {
      vehicleId: vehicle.id,
      type: DocumentType.ITP,
      expiryDate: tenDaysOut,
      issuedDate: new Date('2024-05-01'),
      provider: 'RAR Bucuresti',
    },
  });

  return {
    ok: true as const,
    vehicle: vehicle.plateNumber,
    doc: `ITP expiring ${tenDaysOut.toISOString().slice(0, 10)}`,
  };
}

async function seedLowStockProduct() {
  // Pick the first product. Set its minimumStock high so a stock OUT
  // movement will easily trigger the low-stock alert.
  const product = await prisma.product.findFirst({
    orderBy: { createdAt: 'asc' },
  });
  if (!product) {
    return { ok: false as const, reason: 'No product in DB — skipping' };
  }

  const newMin = Math.max(50, product.currentStock + 25);

  await prisma.product.update({
    where: { id: product.id },
    data: { minimumStock: newMin },
  });

  return {
    ok: true as const,
    sku: product.sku,
    name: product.name,
    current: product.currentStock,
    min: newMin,
  };
}

async function main() {
  console.log('Seeding test users + scenarios...\n');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Create users + employees (no manager links yet)
  for (const spec of SPECS) {
    const emp = await ensureUserAndEmployee(spec, hashedPassword);
    console.log(
      `  ✓ ${spec.email.padEnd(28)} ${spec.department.padEnd(11)} ${emp.position}`,
    );
  }

  // 2. Link manager chain
  await linkManagers();
  console.log('  ✓ Manager chain linked');

  // 3. Vehicle document expiring in 10 days
  const docResult = await seedExpiringDocument();
  if (docResult.ok) {
    console.log(`  ✓ Fleet doc on ${docResult.vehicle}: ${docResult.doc}`);
  } else {
    console.log(`  ⚠ ${docResult.reason}`);
  }

  // 4. Product below minimum
  const prodResult = await seedLowStockProduct();
  if (prodResult.ok) {
    console.log(
      `  ✓ Product ${prodResult.sku} (${prodResult.name}) min=${prodResult.min}, current=${prodResult.current} → next OUT triggers alert`,
    );
  } else {
    console.log(`  ⚠ ${prodResult.reason}`);
  }

  console.log('\n--- Test accounts (password: password123) ---');
  for (const s of SPECS) {
    const mgr = s.managerEmail ? ` (reports to ${s.managerEmail})` : '';
    console.log(`  ${s.email.padEnd(28)} ${s.department.padEnd(11)}${mgr}`);
  }

  console.log('\n--- What to test ---');
  console.log(
    '  1. Login as each account → confirm sidebar/menu reflects their dept permissions',
  );
  console.log(
    '  2. Login as employee@corpex.com → submit a leave request →',
  );
  console.log(
    '     log in as manager@corpex.com or hr@corpex.com → bell shows "Alexandru Stanescu submitted..."',
  );
  console.log(
    '  3. As manager, approve/reject the leave → log back in as employee → bell shows the decision',
  );
  console.log(
    '  4. Assign a project task to employee@corpex.com → that account gets "You were assigned..."',
  );
  console.log(
    '  5. As warehouse@corpex.com (or admin), do a stock OUT movement on the seeded product → ',
  );
  console.log(
    '     warehouse + manager get "stock below minimum" notifications',
  );
  console.log(
    '  6. Fleet expiry: the cron runs at 06:00 UTC daily. To test instantly, temporarily change',
  );
  console.log(
    '     the @Cron(EVERY_DAY_AT_6AM) in apps/api/src/notifications/notifications.scheduler.ts',
  );
  console.log(
    '     to @Cron("*/1 * * * *") — wait 1 min, then revert.',
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
    void pool.end();
  });
