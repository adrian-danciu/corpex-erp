/**
 * Quick UI smoke test for the notifications module.
 *
 * Run from apps/api/:
 *   bunx ts-node seed-notifications.ts                 # lists users, no insert
 *   bunx ts-node seed-notifications.ts <email>         # seeds 8 sample notifications for that user
 *   bunx ts-node seed-notifications.ts <email> --wipe  # deletes that user's notifications first
 *
 * After running, refresh the browser — bell badge should show unread count,
 * dropdown shows the latest 10, /notifications page paginates them, and the
 * dashboard widget shows the top 5.
 */
import {
  PrismaClient,
  NotificationType,
  NotificationEntityType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const wipe = args.includes('--wipe');

  if (!email) {
    const users = await prisma.user.findMany({
      select: { email: true, firstName: true, lastName: true, role: true },
      orderBy: { createdAt: 'asc' },
    });
    console.log('No email provided. Existing users:');
    for (const u of users) {
      console.log(`  - ${u.email}  (${u.firstName} ${u.lastName}, ${u.role})`);
    }
    console.log('\nUsage: bunx ts-node seed-notifications.ts <email> [--wipe]');
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user with email "${email}"`);
    process.exit(1);
  }

  if (wipe) {
    const { count } = await prisma.notification.deleteMany({
      where: { recipientId: user.id },
    });
    console.log(`Deleted ${count} existing notifications for ${email}`);
  }

  const now = new Date();
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

  const samples = [
    {
      type: NotificationType.LEAVE_REQUEST_SUBMITTED,
      title: 'Maria Popescu submitted a leave request',
      body: 'Annual leave, 5 days starting next Monday',
      linkPath: '/hr/approvals',
      entityType: NotificationEntityType.LEAVE_REQUEST,
      entityId: 'demo-leave-1',
      isRead: false,
      createdAt: minutesAgo(8),
    },
    {
      type: NotificationType.PROJECT_TASK_ASSIGNED,
      title: 'You were assigned: Site survey at Bd. Aviatorilor',
      body: 'Due in 3 days',
      linkPath: '/projects/demo',
      entityType: NotificationEntityType.PROJECT_TASK,
      entityId: 'demo-task-1',
      isRead: false,
      createdAt: minutesAgo(45),
    },
    {
      type: NotificationType.STOCK_BELOW_MINIMUM,
      title: 'Cabluri 4mm² (CABL-004) below minimum: 12/50',
      body: 'Warehouse: Depozit Central',
      linkPath: '/stock/products',
      entityType: NotificationEntityType.PRODUCT,
      entityId: 'demo-product-1',
      isRead: false,
      createdAt: hoursAgo(2),
    },
    {
      type: NotificationType.FLEET_DOCUMENT_EXPIRING,
      title: 'ITP for B 123 ABC expires on 2026-05-22',
      linkPath: '/fleet/demo',
      entityType: NotificationEntityType.VEHICLE_DOCUMENT,
      entityId: 'demo-doc-1',
      isRead: false,
      createdAt: hoursAgo(6),
    },
    {
      type: NotificationType.LEAVE_REQUEST_APPROVED,
      title: 'Your leave request was approved by Andrei Ionescu',
      linkPath: '/hr/leave-requests',
      entityType: NotificationEntityType.LEAVE_REQUEST,
      entityId: 'demo-leave-2',
      isRead: true,
      readAt: hoursAgo(11),
      createdAt: hoursAgo(12),
    },
    {
      type: NotificationType.LEAVE_REQUEST_REJECTED,
      title: 'Your leave request was rejected by Andrei Ionescu',
      body: 'Comments: schedule conflict with the Q3 release',
      linkPath: '/hr/leave-requests',
      entityType: NotificationEntityType.LEAVE_REQUEST,
      entityId: 'demo-leave-3',
      isRead: true,
      readAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
    {
      type: NotificationType.PROJECT_TASK_ASSIGNED,
      title: 'You were assigned: Inventory check Q1',
      linkPath: '/projects/demo',
      entityType: NotificationEntityType.PROJECT_TASK,
      entityId: 'demo-task-2',
      isRead: true,
      readAt: daysAgo(4),
      createdAt: daysAgo(5),
    },
    {
      type: NotificationType.FLEET_DOCUMENT_EXPIRING,
      title: 'Rovinietă for B 456 DEF expires on 2026-05-14',
      linkPath: '/fleet/demo',
      entityType: NotificationEntityType.VEHICLE_DOCUMENT,
      entityId: 'demo-doc-2',
      isRead: true,
      readAt: daysAgo(7),
      createdAt: daysAgo(8),
    },
  ];

  for (const s of samples) {
    await prisma.notification.create({
      data: { recipientId: user.id, ...s },
    });
  }

  const totals = await prisma.notification.groupBy({
    by: ['isRead'],
    where: { recipientId: user.id },
    _count: { _all: true },
  });

  const unread = totals.find((r) => !r.isRead)?._count._all ?? 0;
  const read = totals.find((r) => r.isRead)?._count._all ?? 0;

  console.log(
    `Seeded ${samples.length} notifications for ${email}. Now: ${unread} unread, ${read} read.`,
  );
  console.log(
    'Refresh the browser (or click the bell icon) to see them light up.',
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
