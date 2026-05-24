import { BadRequestException } from '@nestjs/common';
import {
  PartnerType,
  PurchaseOrderStatus,
  StockMovementType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  let prisma: {
    $transaction: jest.Mock;
    partner: { findUnique: jest.Mock };
    warehouse: { findUnique: jest.Mock };
    product: { findMany: jest.Mock; update: jest.Mock };
    purchaseOrder: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let tx: {
    purchaseOrder: { findUnique: jest.Mock; update: jest.Mock };
    purchaseOrderReceipt: { create: jest.Mock };
    purchaseOrderLine: { update: jest.Mock; findMany: jest.Mock };
    productStock: { upsert: jest.Mock; aggregate: jest.Mock };
    product: { update: jest.Mock };
    stockMovement: { create: jest.Mock };
  };
  let service: PurchaseOrdersService;

  beforeEach(() => {
    tx = {
      purchaseOrder: { findUnique: jest.fn(), update: jest.fn() },
      purchaseOrderReceipt: { create: jest.fn() },
      purchaseOrderLine: { update: jest.fn(), findMany: jest.fn() },
      productStock: { upsert: jest.fn(), aggregate: jest.fn() },
      product: { update: jest.fn() },
      stockMovement: { create: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      partner: { findUnique: jest.fn() },
      warehouse: { findUnique: jest.fn() },
      product: { findMany: jest.fn(), update: jest.fn() },
      purchaseOrder: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new PurchaseOrdersService(prisma as unknown as PrismaService);
  });

  const validInput = {
    supplierId: 'supplier-1',
    warehouseId: 'warehouse-1',
    lines: [{ productId: 'product-1', qtyOrdered: 2, unitCost: 10 }],
  };

  it('rejects purchase orders without lines', async () => {
    await expect(
      service.create(
        {
          supplierId: 'supplier-1',
          warehouseId: 'warehouse-1',
          lines: [],
        },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects partners that are not suppliers', async () => {
    prisma.partner.findUnique.mockResolvedValue({
      id: 'partner-1',
      name: 'Client SRL',
      partnerType: PartnerType.CLIENT,
    });
    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-1',
      code: 'WH1',
      isActive: true,
    });

    await expect(service.create(validInput, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects inactive warehouses', async () => {
    prisma.partner.findUnique.mockResolvedValue({
      id: 'supplier-1',
      name: 'Supplier SRL',
      partnerType: PartnerType.SUPPLIER,
      isActive: true,
    });
    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-1',
      code: 'WH1',
      isActive: false,
    });

    await expect(service.create(validInput, 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects inactive suppliers', async () => {
    prisma.partner.findUnique.mockResolvedValue({
      id: 'supplier-1',
      name: 'Supplier SRL',
      partnerType: PartnerType.SUPPLIER,
      isActive: false,
    });
    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-1',
      code: 'WH1',
      isActive: true,
    });

    await expect(service.create(validInput, 'user-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.product.findMany).not.toHaveBeenCalled();
  });

  it('rejects updating a draft order to an inactive supplier', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.DRAFT,
      receipts: [],
    });
    prisma.partner.findUnique.mockResolvedValue({
      id: 'supplier-1',
      name: 'Supplier SRL',
      partnerType: PartnerType.SUPPLIER,
      isActive: false,
    });

    await expect(
      service.update({ id: 'po-1', supplierId: 'supplier-1' }),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('receipt cannot exceed remaining ordered quantity', async () => {
    tx.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      warehouseId: 'warehouse-1',
      status: PurchaseOrderStatus.ORDERED,
      lines: [
        {
          id: 'line-1',
          productId: 'product-1',
          qtyOrdered: 5,
          qtyReceived: 3,
        },
      ],
    });

    await expect(
      service.recordReceipt(
        {
          orderId: 'po-1',
          lines: [{ orderLineId: 'line-1', qtyReceived: 3 }],
        },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('confirming respects draft status rules', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.ORDERED,
      lines: [{ id: 'line-1' }],
    });

    await expect(service.confirm('po-1')).rejects.toThrow(BadRequestException);
  });

  it('cancelling rejects fully received purchase orders', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.FULLY_RECEIVED,
    });

    await expect(service.cancel('po-1')).rejects.toThrow(BadRequestException);
  });

  it('deleting rejects non-draft purchase orders', async () => {
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      status: PurchaseOrderStatus.ORDERED,
      receipts: [],
    });

    await expect(service.delete('po-1')).rejects.toThrow(BadRequestException);
    expect(prisma.purchaseOrder.delete).not.toHaveBeenCalled();
  });

  it('records receipt stock movements for valid receipts', async () => {
    const receivedDate = new Date('2026-05-01T00:00:00.000Z');
    tx.purchaseOrder.findUnique.mockResolvedValue({
      id: 'po-1',
      number: 42,
      warehouseId: 'warehouse-1',
      status: PurchaseOrderStatus.ORDERED,
      lines: [
        {
          id: 'line-1',
          productId: 'product-1',
          qtyOrdered: 5,
          qtyReceived: 0,
          unitCost: 12,
        },
      ],
    });
    tx.purchaseOrderReceipt.create.mockResolvedValue({
      id: 'receipt-1',
      nirNumber: 7,
      receivedDate,
      lines: [
        {
          id: 'receipt-line-1',
          qtyReceived: 2,
          orderLine: {
            id: 'line-1',
            productId: 'product-1',
            unitCost: 12,
          },
        },
      ],
    });
    tx.purchaseOrderLine.findMany.mockResolvedValue([
      { qtyOrdered: 5, qtyReceived: 2 },
    ]);
    tx.productStock.aggregate.mockResolvedValue({
      _sum: { quantity: 2 },
    });

    await service.recordReceipt(
      {
        orderId: 'po-1',
        receivedDate,
        lines: [{ orderLineId: 'line-1', qtyReceived: 2 }],
      },
      'user-1',
    );

    const stockMovementCreate = tx.stockMovement.create as jest.MockedFunction<
      (args: { data: Record<string, unknown> }) => unknown
    >;
    const stockMovementArgs = stockMovementCreate.mock.calls[0]?.[0];
    expect(stockMovementArgs.data).toMatchObject({
      productId: 'product-1',
      warehouseId: 'warehouse-1',
      type: StockMovementType.IN,
      quantity: 2,
      unitCost: 12,
      reference: 'PO-42 / NIR-7',
      purchaseReceiptLineId: 'receipt-line-1',
    });
    expect(tx.purchaseOrder.update).toHaveBeenCalledWith({
      where: { id: 'po-1' },
      data: { status: PurchaseOrderStatus.PARTIALLY_RECEIVED },
    });
  });
});
