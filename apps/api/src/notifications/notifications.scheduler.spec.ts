import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsScheduler } from './notifications.scheduler';
import { NotificationsService } from './notifications.service';

describe('NotificationsScheduler', () => {
  const prisma = {
    invoice: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const notifications = {
    notifyInvoiceOverdue: jest.fn(),
  };
  let scheduler: NotificationsScheduler;

  beforeEach(() => {
    jest.clearAllMocks();
    scheduler = new NotificationsScheduler(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
    );
  });

  it('marks past-due issued invoices overdue and emits notifications', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        series: 'CORP',
        number: 12,
        total: 100,
        paidAmount: 25,
        isClientInvoice: true,
        projectId: 'project-1',
        partner: { name: 'Client SRL' },
      },
    ]);
    prisma.invoice.updateMany.mockResolvedValue({ count: 1 });

    await scheduler.scanOverdueInvoices();

    expect(prisma.invoice.findMany).toHaveBeenCalledWith({
      where: {
        dueDate: { lt: expect.any(Date) },
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID],
        },
      },
      include: { partner: true },
    });
    expect(prisma.invoice.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'invoice-1',
        status: {
          in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID],
        },
      },
      data: { status: InvoiceStatus.OVERDUE },
    });
    expect(notifications.notifyInvoiceOverdue).toHaveBeenCalledWith({
      invoiceId: 'invoice-1',
      formattedNumber: 'CORP-0012',
      partnerName: 'Client SRL',
      isClientInvoice: true,
      projectId: 'project-1',
      outstandingAmount: 75,
    });
  });

  it('does not notify when another process already transitioned the invoice', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        series: 'CORP',
        number: 12,
        total: 100,
        paidAmount: 0,
        isClientInvoice: true,
        projectId: null,
        partner: { name: 'Client SRL' },
      },
    ]);
    prisma.invoice.updateMany.mockResolvedValue({ count: 0 });

    await scheduler.scanOverdueInvoices();

    expect(notifications.notifyInvoiceOverdue).not.toHaveBeenCalled();
  });
});
