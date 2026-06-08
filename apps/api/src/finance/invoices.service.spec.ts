import { BadRequestException } from '@nestjs/common';
import {
  InvoiceItemSourceType,
  InvoiceStatus,
  InvoiceType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceSourceValidationService } from './invoice-source-validation.service';
import { InvoicesService } from './invoices.service';
import { ProjectInvoiceCostsService } from './project-invoice-costs.service';

describe('InvoicesService', () => {
  let tx: {
    project: { findUnique: jest.Mock };
    projectMaterial: { findMany: jest.Mock };
    projectService: { findMany: jest.Mock };
    vehicleExpense: { findMany: jest.Mock };
    purchaseOrder: { findUnique: jest.Mock };
    purchaseOrderReceiptLine: { findMany: jest.Mock };
    invoiceItem: { findMany: jest.Mock };
    invoice: { create: jest.Mock };
  };
  let prisma: {
    $transaction: jest.Mock;
    invoice: {
      count: jest.Mock;
      delete: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: InvoicesService;

  const supplierInvoice = {
    series: 'SUP',
    invoiceType: InvoiceType.FISCAL,
    partnerId: 'supplier-1',
    isClientInvoice: false,
    issueDate: new Date('2026-06-07T00:00:00.000Z'),
    dueDate: new Date('2026-07-07T00:00:00.000Z'),
    currency: 'EUR',
    purchaseOrderId: 'order-1',
    items: [
      {
        description: 'Received cable',
        quantity: 5,
        unit: 'buc',
        unitPrice: 10,
        vatRate: 19,
        sourceType: InvoiceItemSourceType.PURCHASE_RECEIPT_LINE,
        sourceId: 'receipt-line-1',
      },
    ],
  };

  beforeEach(() => {
    tx = {
      project: { findUnique: jest.fn() },
      projectMaterial: { findMany: jest.fn() },
      projectService: { findMany: jest.fn() },
      vehicleExpense: { findMany: jest.fn() },
      purchaseOrder: { findUnique: jest.fn() },
      purchaseOrderReceiptLine: { findMany: jest.fn() },
      invoiceItem: { findMany: jest.fn() },
      invoice: { create: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn(
        (
          callback: (client: typeof tx) => unknown,
          _options: { isolationLevel: Prisma.TransactionIsolationLevel },
        ) => callback(tx),
      ),
      invoice: {
        count: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    const prismaService = prisma as unknown as PrismaService;
    service = new InvoicesService(
      prismaService,
      new InvoiceSourceValidationService(),
      new ProjectInvoiceCostsService(prismaService),
    );

    tx.purchaseOrder.findUnique.mockResolvedValue({
      supplierId: supplierInvoice.partnerId,
    });
    tx.purchaseOrderReceiptLine.findMany.mockResolvedValue([
      { id: 'receipt-line-1', qtyReceived: 5 },
    ]);
    tx.invoiceItem.findMany.mockResolvedValue([]);
    tx.invoice.create.mockResolvedValue({ id: 'invoice-1' });
    tx.project.findUnique.mockResolvedValue({ partnerId: 'client-1' });
    tx.projectMaterial.findMany.mockResolvedValue([]);
    tx.projectService.findMany.mockResolvedValue([]);
    tx.vehicleExpense.findMany.mockResolvedValue([]);
  });

  it('creates a supplier invoice from unbilled receipt lines atomically', async () => {
    await expect(
      service.create(supplierInvoice, 'user-1'),
    ).resolves.toEqual({ id: 'invoice-1' });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.purchaseOrderReceiptLine.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['receipt-line-1'] },
        receipt: { orderId: supplierInvoice.purchaseOrderId },
      },
      select: { id: true, qtyReceived: true },
    });
    expect(tx.invoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          supplierId: supplierInvoice.partnerId,
          purchaseOrderId: supplierInvoice.purchaseOrderId,
          subtotal: 50,
          vatTotal: 9.5,
          total: 59.5,
        }),
      }),
    );
  });

  it('rejects receipt quantities that have already been fully invoiced', async () => {
    tx.invoiceItem.findMany.mockResolvedValue([
      { sourceId: 'receipt-line-1', quantity: 5 },
    ]);

    await expect(service.create(supplierInvoice, 'user-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(tx.invoice.create).not.toHaveBeenCalled();
  });

  it('allows invoicing the remaining quantity after a partial invoice', async () => {
    tx.invoiceItem.findMany.mockResolvedValue([
      { sourceId: 'receipt-line-1', quantity: 2 },
    ]);

    await expect(
      service.create(
        {
          ...supplierInvoice,
          items: [{ ...supplierInvoice.items[0], quantity: 3 }],
        },
        'user-1',
      ),
    ).resolves.toEqual({ id: 'invoice-1' });
  });

  it('rejects purchase orders belonging to another supplier', async () => {
    tx.purchaseOrder.findUnique.mockResolvedValue({
      supplierId: 'supplier-2',
    });

    await expect(service.create(supplierInvoice, 'user-1')).rejects.toThrow(
      'The purchase order does not belong to the selected supplier',
    );

    expect(tx.purchaseOrderReceiptLine.findMany).not.toHaveBeenCalled();
    expect(tx.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects invoiced quantities above the received quantity', async () => {
    tx.purchaseOrderReceiptLine.findMany.mockResolvedValue([
      { id: 'receipt-line-1', qtyReceived: 4 },
    ]);

    await expect(service.create(supplierInvoice, 'user-1')).rejects.toThrow(
      'An invoiced receipt quantity cannot exceed its remaining uninvoiced quantity',
    );

    expect(tx.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate receipt lines within the same invoice', async () => {
    await expect(
      service.create(
        {
          ...supplierInvoice,
          items: [...supplierInvoice.items, supplierInvoice.items[0]],
        },
        'user-1',
      ),
    ).rejects.toThrow('An invoice source can only appear once on an invoice');

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('allows a draft invoice to be issued', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      status: InvoiceStatus.DRAFT,
      paidAmount: 0,
      payments: [],
    });
    prisma.invoice.update.mockResolvedValue({
      id: 'invoice-1',
      status: InvoiceStatus.SENT,
    });

    await service.updateStatus({
      id: 'invoice-1',
      status: InvoiceStatus.SENT,
    });

    expect(prisma.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'invoice-1' },
        data: { status: InvoiceStatus.SENT },
      }),
    );
  });

  it('rejects manually marking an invoice as paid', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      status: InvoiceStatus.SENT,
      paidAmount: 0,
      payments: [],
    });

    await expect(
      service.updateStatus({
        id: 'invoice-1',
        status: InvoiceStatus.PAID,
      }),
    ).rejects.toThrow('Invoice status cannot change from SENT to PAID');

    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('rejects cancelling an invoice with recorded payments', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      status: InvoiceStatus.SENT,
      paidAmount: 10,
      payments: [{ id: 'payment-1' }],
    });

    await expect(
      service.updateStatus({
        id: 'invoice-1',
        status: InvoiceStatus.CANCELLED,
      }),
    ).rejects.toThrow('Invoices with recorded payments cannot be cancelled');

    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('rejects transitions from terminal invoice statuses', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      status: InvoiceStatus.CANCELLED,
      paidAmount: 0,
      payments: [],
    });

    await expect(
      service.updateStatus({
        id: 'invoice-1',
        status: InvoiceStatus.SENT,
      }),
    ).rejects.toThrow('Invoice status cannot change from CANCELLED to SENT');

    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('allows deleting an unpaid draft invoice', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      status: InvoiceStatus.DRAFT,
      paidAmount: 0,
      payments: [],
    });
    prisma.invoice.delete.mockResolvedValue({ id: 'invoice-1' });

    await expect(service.remove('invoice-1')).resolves.toEqual({
      id: 'invoice-1',
    });

    expect(prisma.invoice.delete).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'invoice-1' },
      }),
    );
  });

  it.each([
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
    InvoiceStatus.CANCELLED,
  ])('rejects permanently deleting an invoice with status %s', async (status) => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      status,
      paidAmount: 0,
      payments: [],
    });

    await expect(service.remove('invoice-1')).rejects.toThrow(
      'Only draft invoices can be permanently deleted',
    );

    expect(prisma.invoice.delete).not.toHaveBeenCalled();
  });

  it('rejects deleting a draft with recorded payment history', async () => {
    prisma.invoice.findUnique.mockResolvedValue({
      id: 'invoice-1',
      status: InvoiceStatus.DRAFT,
      paidAmount: 10,
      payments: [{ id: 'payment-1' }],
    });

    await expect(service.remove('invoice-1')).rejects.toThrow(
      'Invoices with recorded payments cannot be deleted',
    );

    expect(prisma.invoice.delete).not.toHaveBeenCalled();
  });

  it('builds finance overview totals from all outstanding invoices', async () => {
    prisma.invoice.findMany
      .mockResolvedValueOnce([
        { total: 100, paidAmount: 25 },
        { total: 200, paidAmount: 200 },
      ])
      .mockResolvedValueOnce([
        { total: 300, paidAmount: 100 },
        { total: 50, paidAmount: 0 },
      ])
      .mockResolvedValueOnce([
        { total: 80, paidAmount: 20 },
        { total: 40, paidAmount: 50 },
      ]);
    prisma.invoice.count.mockResolvedValue(7);

    await expect(service.getFinanceOverview()).resolves.toEqual({
      totalReceivable: 75,
      totalPayable: 250,
      overdueAmount: 60,
      invoicesThisMonth: 7,
    });

    expect(prisma.invoice.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        isClientInvoice: true,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      select: { total: true, paidAmount: true },
    });
    expect(prisma.invoice.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        isClientInvoice: false,
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      select: { total: true, paidAmount: true },
    });
    expect(prisma.invoice.count).toHaveBeenCalledWith({
      where: {
        issueDate: { gte: expect.any(Date), lte: expect.any(Date) },
        status: { not: InvoiceStatus.CANCELLED },
      },
    });
  });

  it('rejects non-manual source types without a source ID', async () => {
    await expect(
      service.create(
        {
          ...supplierInvoice,
          items: [
            {
              ...supplierInvoice.items[0],
              sourceId: undefined,
            },
          ],
        },
        'user-1',
      ),
    ).rejects.toThrow(
      'Invoice source PURCHASE_RECEIPT_LINE requires a source ID',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects manual lines with source IDs', async () => {
    await expect(
      service.create(
        {
          ...supplierInvoice,
          items: [
            {
              ...supplierInvoice.items[0],
              sourceType: InvoiceItemSourceType.MANUAL,
            },
          ],
        },
        'user-1',
      ),
    ).rejects.toThrow('Manual invoice items cannot include a source ID');

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('validates project sources and rejects previously invoiced sources', async () => {
    tx.projectMaterial.findMany.mockResolvedValue([{ id: 'material-1' }]);
    tx.invoiceItem.findMany.mockResolvedValue([
      {
        sourceType: InvoiceItemSourceType.PROJECT_MATERIAL,
        sourceId: 'material-1',
      },
    ]);

    await expect(
      service.create(
        {
          ...supplierInvoice,
          partnerId: 'client-1',
          isClientInvoice: true,
          purchaseOrderId: undefined,
          projectId: 'project-1',
          items: [
            {
              description: 'Issued material',
              quantity: 1,
              unit: 'buc',
              unitPrice: 10,
              vatRate: 19,
              projectId: 'project-1',
              sourceType: InvoiceItemSourceType.PROJECT_MATERIAL,
              sourceId: 'material-1',
            },
          ],
        },
        'user-1',
      ),
    ).rejects.toThrow(
      'One or more project invoice sources have already been invoiced',
    );

    expect(tx.projectMaterial.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['material-1'] },
        projectId: 'project-1',
        status: {
          in: ['PARTIALLY_ISSUED', 'FULLY_ISSUED'],
        },
      },
      select: { id: true },
    });
    expect(tx.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects project sources belonging to another project', async () => {
    tx.projectMaterial.findMany.mockResolvedValue([]);

    await expect(
      service.create(
        {
          ...supplierInvoice,
          partnerId: 'client-1',
          isClientInvoice: true,
          purchaseOrderId: undefined,
          projectId: 'project-1',
          items: [
            {
              description: 'Issued material',
              quantity: 1,
              unit: 'buc',
              unitPrice: 10,
              vatRate: 19,
              sourceType: InvoiceItemSourceType.PROJECT_MATERIAL,
              sourceId: 'material-other-project',
            },
          ],
        },
        'user-1',
      ),
    ).rejects.toThrow(
      'One or more project invoice sources are invalid, unavailable, or belong to another project',
    );

    expect(tx.invoice.create).not.toHaveBeenCalled();
  });

  it('rejects project sources when the selected client does not own the project', async () => {
    tx.project.findUnique.mockResolvedValue({ partnerId: 'client-2' });

    await expect(
      service.create(
        {
          ...supplierInvoice,
          partnerId: 'client-1',
          isClientInvoice: true,
          purchaseOrderId: undefined,
          projectId: 'project-1',
          items: [
            {
              description: 'Service',
              quantity: 1,
              unit: 'service',
              unitPrice: 10,
              vatRate: 19,
              sourceType: InvoiceItemSourceType.PROJECT_SERVICE,
              sourceId: 'service-1',
            },
          ],
        },
        'user-1',
      ),
    ).rejects.toThrow('The project does not belong to the selected client');

    expect(tx.projectService.findMany).not.toHaveBeenCalled();
    expect(tx.invoice.create).not.toHaveBeenCalled();
  });
});
