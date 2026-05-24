import { BadRequestException } from '@nestjs/common';
import { StockMovementType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
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
    service = new StockService(
      prisma as unknown as PrismaService,
      {
        notifyStockBelowMinimum: jest.fn(),
      } as unknown as NotificationsService,
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
    });

    await expect(
      service.createStockMovement(
        {
          productId: 'product-1',
          warehouseId: 'warehouse-1',
          type: StockMovementType.ADJUSTMENT,
          quantity: 1,
        },
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);
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
