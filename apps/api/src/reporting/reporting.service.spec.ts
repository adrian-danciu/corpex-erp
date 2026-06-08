import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ReportingService } from './reporting.service';

describe('ReportingService', () => {
  let service: ReportingService;

  const prisma = {
    user: {
      count: jest.fn(),
    },
    employee: {
      count: jest.fn(),
    },
    leaveRequest: {
      count: jest.fn(),
    },
    invoice: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    productStock: {
      findMany: jest.fn(),
    },
    stockMovement: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        ReportingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ReportingService);
  });

  it('builds stock report from current product stock balances', async () => {
    prisma.productStock.findMany.mockResolvedValue([
      {
        productId: 'product-1',
        quantity: 7,
        product: { id: 'product-1', name: 'Cable', sku: 'CBL-01' },
        warehouse: { name: 'Main Warehouse' },
      },
    ]);

    await expect(service.getStockReport()).resolves.toEqual([
      {
        productId: 'product-1',
        productName: 'Cable',
        sku: 'CBL-01',
        warehouseName: 'Main Warehouse',
        quantity: 7,
      },
    ]);
    expect(prisma.productStock.findMany).toHaveBeenCalledWith({
      where: { quantity: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: [
        { product: { name: 'asc' } },
        { warehouse: { name: 'asc' } },
      ],
    });
    expect(prisma.stockMovement.findMany).not.toHaveBeenCalled();
  });

  it('builds dashboard invoice metrics from client invoices only', async () => {
    prisma.user.count.mockResolvedValue(3);
    prisma.employee.count.mockResolvedValue(2);
    prisma.leaveRequest.count.mockResolvedValue(0);
    prisma.invoice.aggregate
      .mockResolvedValueOnce({
        _count: { id: 4 },
        _sum: { total: 1000, paidAmount: 600 },
      })
      .mockResolvedValueOnce({
        _count: { id: 3 },
        _sum: { total: 700, paidAmount: 200 },
      });
    prisma.invoice.count.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await expect(service.getDashboardMetrics()).resolves.toEqual(
      expect.objectContaining({
        totalInvoices: 4,
        overdueInvoices: 1,
        totalInvoicedAmount: 1000,
        totalPaidAmount: 600,
        totalSupplierInvoices: 3,
        overdueSupplierInvoices: 2,
        totalPayableAmount: 700,
        totalSupplierPaidAmount: 200,
      }),
    );

    expect(prisma.invoice.aggregate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ isClientInvoice: true }),
      }),
    );
    expect(prisma.invoice.aggregate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ isClientInvoice: false }),
      }),
    );
    expect(prisma.invoice.count).toHaveBeenNthCalledWith(1, {
      where: {
        isClientInvoice: true,
        status: 'OVERDUE',
      },
    });
    expect(prisma.invoice.count).toHaveBeenNthCalledWith(2, {
      where: {
        isClientInvoice: false,
        status: 'OVERDUE',
      },
    });
  });

  it('builds aging buckets from client receivables only', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        dueDate: new Date(),
        total: 100,
        paidAmount: 25,
      },
    ]);

    await expect(service.getFinanceAgingSummary()).resolves.toEqual([
      { label: '0-30', amount: 75, invoiceCount: 1 },
      { label: '31-60', amount: 0, invoiceCount: 0 },
      { label: '61-90', amount: 0, invoiceCount: 0 },
      { label: '90+', amount: 0, invoiceCount: 0 },
    ]);

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isClientInvoice: true }),
      }),
    );
  });

  it('builds aging buckets from supplier payables only', async () => {
    prisma.invoice.findMany.mockResolvedValue([
      {
        id: 'invoice-1',
        dueDate: new Date(),
        total: 200,
        paidAmount: 50,
      },
    ]);

    await expect(service.getSupplierAgingSummary()).resolves.toEqual([
      { label: '0-30', amount: 150, invoiceCount: 1 },
      { label: '31-60', amount: 0, invoiceCount: 0 },
      { label: '61-90', amount: 0, invoiceCount: 0 },
      { label: '90+', amount: 0, invoiceCount: 0 },
    ]);

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isClientInvoice: false }),
      }),
    );
  });
});
