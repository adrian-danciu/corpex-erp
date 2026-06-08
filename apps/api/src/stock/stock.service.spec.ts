import { BadRequestException } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { StockLedgerService } from './stock-ledger.service';
import { StockService } from './stock.service';

describe('StockService', () => {
  let prisma: {
    $transaction: jest.Mock;
    product: { findUnique: jest.Mock };
    warehouse: { findUnique: jest.Mock };
  };
  let tx: {
    productStock: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
      aggregate: jest.Mock;
    };
    product: { update: jest.Mock };
    stockMovement: { create: jest.Mock };
  };
  let service: StockService;
  let notifications: NotificationsService;

  beforeEach(() => {
    tx = {
      productStock: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        aggregate: jest.fn(),
      },
      product: { update: jest.fn() },
      stockMovement: { create: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
      product: { findUnique: jest.fn() },
      warehouse: { findUnique: jest.fn() },
    };
    notifications = {
      notifyStockBelowMinimum: jest.fn(),
    } as unknown as NotificationsService;
    service = new StockService(
      prisma as unknown as PrismaService,
      notifications,
      new StockLedgerService(prisma as unknown as PrismaService, notifications),
    );
  });

  function mockExistingRefs() {
    prisma.product.findUnique.mockResolvedValue({
      id: 'product-1',
      name: 'Cable',
      sku: 'CAB-1',
      minimumStock: 0,
      currentStock: 0,
    });
    prisma.warehouse.findUnique.mockResolvedValue({
      id: 'warehouse-1',
      code: 'WH1',
    });
  }

  it('inbound stock increases warehouse quantity', async () => {
    mockExistingRefs();
    tx.productStock.findUnique.mockResolvedValue({
      quantity: 5,
      defectiveQty: 1,
    });
    tx.productStock.aggregate.mockResolvedValue({
      _sum: { quantity: 8, defectiveQty: 1 },
    });
    tx.stockMovement.create.mockResolvedValue({ id: 'movement-1' });

    await service.createStockMovement(
      {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        type: StockMovementType.IN,
        quantity: 3,
      },
      'user-1',
    );

    expect(tx.productStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { quantity: 8 },
      }),
    );
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { currentStock: 7 },
    });
  });

  it('outbound stock rejects when sellable quantity is insufficient', async () => {
    mockExistingRefs();
    tx.productStock.findUnique.mockResolvedValue({
      quantity: 5,
      defectiveQty: 2,
    });

    await expect(
      service.createStockMovement(
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          type: StockMovementType.OUT,
          quantity: 4,
        },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(tx.productStock.upsert).not.toHaveBeenCalled();
  });

  it('adjustment cannot go below defective quantity', async () => {
    mockExistingRefs();
    tx.productStock.findUnique.mockResolvedValue({
      quantity: 5,
      defectiveQty: 2,
      reservedQty: 1,
    });

    await expect(
      service.createStockMovement(
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          type: StockMovementType.ADJUSTMENT,
          quantity: 2,
        },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('adjustment can set warehouse stock to zero when nothing is protected', async () => {
    mockExistingRefs();
    tx.productStock.findUnique.mockResolvedValue({
      quantity: 5,
      defectiveQty: 0,
      reservedQty: 0,
    });
    tx.productStock.aggregate.mockResolvedValue({
      _sum: { quantity: 0, defectiveQty: 0 },
    });
    tx.stockMovement.create.mockResolvedValue({ id: 'movement-1' });

    await service.createStockMovement(
      {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        type: StockMovementType.ADJUSTMENT,
        quantity: 0,
      },
      'user-1',
    );

    expect(tx.productStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { quantity: 0 },
      }),
    );
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { currentStock: 0 },
    });
  });

  it('rejects negative adjustments', async () => {
    await expect(
      service.createStockMovement(
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          type: StockMovementType.ADJUSTMENT,
          quantity: -1,
        },
        'user-1',
      ),
    ).rejects.toThrow('Quantity cannot be negative');

    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects zero quantity for non-adjustment movements', async () => {
    await expect(
      service.createStockMovement(
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          type: StockMovementType.IN,
          quantity: 0,
        },
        'user-1',
      ),
    ).rejects.toThrow(
      'Quantity must be greater than 0 for non-adjustment movements',
    );

    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('current stock recomputes from sellable stock after outbound movement', async () => {
    mockExistingRefs();
    tx.productStock.findUnique.mockResolvedValue({
      quantity: 10,
      defectiveQty: 3,
    });
    tx.productStock.aggregate.mockResolvedValue({
      _sum: { quantity: 8, defectiveQty: 3 },
    });
    tx.stockMovement.create.mockResolvedValue({ id: 'movement-1' });

    await service.createStockMovement(
      {
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        type: StockMovementType.OUT,
        quantity: 2,
      },
      'user-1',
    );

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1' },
      data: { currentStock: 5 },
    });
  });
});
