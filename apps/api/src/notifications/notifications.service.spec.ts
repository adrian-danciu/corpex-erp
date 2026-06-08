import {
  Department,
  NotificationEntityType,
  NotificationType,
  ProjectMemberRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService overdue invoices', () => {
  const prisma = {
    employee: { findMany: jest.fn() },
    projectMember: { findMany: jest.fn() },
    notification: {
      findFirst: jest.fn(),
      createMany: jest.fn(),
    },
  };
  let service: NotificationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.notification.findFirst.mockResolvedValue(null);
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('notifies finance, management, and project managers for client invoices', async () => {
    prisma.employee.findMany.mockResolvedValue([
      { userId: 'finance-1' },
      { userId: 'management-1' },
    ]);
    prisma.projectMember.findMany.mockResolvedValue([
      { userId: 'project-manager-1' },
    ]);

    await service.notifyInvoiceOverdue({
      invoiceId: 'invoice-1',
      formattedNumber: 'CORP-0012',
      partnerName: 'Client SRL',
      isClientInvoice: true,
      projectId: 'project-1',
      outstandingAmount: 75,
    });

    expect(prisma.employee.findMany).toHaveBeenCalledWith({
      where: {
        department: { in: [Department.FINANCE, Department.MANAGEMENT] },
        userId: { not: null },
      },
      select: { userId: true },
    });
    expect(prisma.projectMember.findMany).toHaveBeenCalledWith({
      where: {
        projectId: 'project-1',
        role: ProjectMemberRole.PROJECT_MANAGER,
        leftAt: null,
      },
      select: { userId: true },
    });
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          recipientId: 'finance-1',
          type: NotificationType.INVOICE_OVERDUE,
          entityType: NotificationEntityType.INVOICE,
          entityId: 'invoice-1',
        }),
        expect.objectContaining({ recipientId: 'project-manager-1' }),
      ]),
    });
  });

  it('does not notify project managers for supplier invoices', async () => {
    prisma.employee.findMany.mockResolvedValue([{ userId: 'finance-1' }]);

    await service.notifyInvoiceOverdue({
      invoiceId: 'invoice-1',
      formattedNumber: 'SUP-0012',
      partnerName: 'Supplier SRL',
      isClientInvoice: false,
      projectId: 'project-1',
      outstandingAmount: 75,
    });

    expect(prisma.projectMember.findMany).not.toHaveBeenCalled();
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ recipientId: 'finance-1' })],
    });
  });
});
