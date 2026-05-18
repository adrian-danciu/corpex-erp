import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { CreateStockMovementInput } from './dto/create-stock-movement.input';
import { CreateWarehouseInput } from './dto/create-warehouse.input';
import { StockMovementFilterInput } from './dto/stock-movement-filter.input';
import { Product } from './entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockOverview } from './entities/stock-overview.type';
import { Warehouse } from './entities/warehouse.entity';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Recompute `Product.currentStock` as the sellable on-hand sum across
   * warehouses: SUM(quantity - defectiveQty). Defective units are physically
   * in the warehouse but not sellable, so they must not count.
   */
  private async recomputeProductCurrentStock(
    productId: string,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const agg = await tx.productStock.aggregate({
      where: { productId },
      _sum: { quantity: true, defectiveQty: true },
    });
    const sellable =
      (agg._sum.quantity ?? 0) - (agg._sum.defectiveQty ?? 0);
    await tx.product.update({
      where: { id: productId },
      data: { currentStock: sellable },
    });
    return sellable;
  }

  /**
   * Best-effort: if the product's stock is now below its minimum, emit a
   * low-stock notification. The 24h dedup in NotificationsService ensures
   * we don't spam recipients on every subsequent movement.
   */
  private async maybeEmitLowStock(productId: string): Promise<void> {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) return;
      if (product.minimumStock <= 0) return;
      if (product.currentStock >= product.minimumStock) return;

      await this.notifications.notifyStockBelowMinimum({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentStock: product.currentStock,
        minimumStock: product.minimumStock,
      });
    } catch (err) {
      this.logger.error('Failed to emit notifyStockBelowMinimum', err);
    }
  }

  async createWarehouse(input: CreateWarehouseInput): Promise<Warehouse> {
    const existing = await this.prisma.warehouse.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new ConflictException(
        `Warehouse with code ${input.code} already exists`,
      );
    }

    return this.prisma.warehouse.create({
      data: {
        name: input.name,
        code: input.code,
        address: input.address,
        city: input.city,
        country: input.country || 'Romania',
      },
    });
  }

  async createProduct(input: CreateProductInput): Promise<Product> {
    const existing = await this.prisma.product.findUnique({
      where: { sku: input.sku },
    });

    if (existing) {
      throw new ConflictException(
        `Product with SKU ${input.sku} already exists`,
      );
    }

    return this.prisma.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        description: input.description,
        unit: input.unit || 'pcs',
        category: input.category,
        minimumStock: input.minimumStock ?? 0,
        unitPrice: input.unitPrice ?? 0,
      },
    });
  }

  async updateProduct(input: UpdateProductInput): Promise<Product> {
    const existing = await this.prisma.product.findUnique({
      where: { id: input.productId },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }

    return this.prisma.product.update({
      where: { id: input.productId },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        unit: input.unit ?? undefined,
        category: input.category ?? undefined,
        minimumStock: input.minimumStock ?? undefined,
        unitPrice: input.unitPrice ?? undefined,
        isActive: input.isActive ?? undefined,
      },
    });
  }

  async productStockByProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }
    return this.prisma.productStock.findMany({
      where: { productId },
      include: { warehouse: true },
      orderBy: { warehouse: { code: 'asc' } },
    });
  }

  async createStockMovement(
    input: CreateStockMovementInput,
    createdById: string,
  ): Promise<StockMovement> {
    if (input.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const [product, warehouse] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: input.productId } }),
      this.prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
    ]);

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${input.productId} not found`,
      );
    }

    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${input.warehouseId} not found`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const currentStock = await tx.productStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
      });

      const previousQuantity = currentStock?.quantity ?? 0;
      const defectiveQty = currentStock?.defectiveQty ?? 0;
      const sellable = previousQuantity - defectiveQty;
      let nextQuantity = previousQuantity;

      if (input.type === StockMovementType.IN) {
        nextQuantity = previousQuantity + input.quantity;
      } else if (input.type === StockMovementType.OUT) {
        if (sellable < input.quantity) {
          throw new BadRequestException(
            `Insufficient stock in warehouse ${warehouse.code}. Sellable: ${sellable} (on-hand ${previousQuantity}, defective ${defectiveQty})`,
          );
        }
        nextQuantity = previousQuantity - input.quantity;
      } else if (input.type === StockMovementType.ADJUSTMENT) {
        if (input.quantity < 0) {
          throw new BadRequestException('Adjusted quantity cannot be negative');
        }
        if (input.quantity < defectiveQty) {
          throw new BadRequestException(
            `Cannot adjust below defective quantity (${defectiveQty}). Scrap defective units first.`,
          );
        }
        nextQuantity = input.quantity;
      } else {
        throw new BadRequestException(
          `Movement type ${input.type} is not allowed via createStockMovement; use the dedicated mutation`,
        );
      }

      await tx.productStock.upsert({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        update: { quantity: nextQuantity },
        create: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          quantity: nextQuantity,
        },
      });

      await this.recomputeProductCurrentStock(input.productId, tx);

      return tx.stockMovement.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: input.type,
          quantity: input.quantity,
          unitCost: input.unitCost,
          reference: input.reference,
          notes: input.notes,
          createdById,
        },
        include: {
          product: true,
          warehouse: true,
          createdBy: true,
        },
      });
    });

    // Outside the transaction: notify if the product fell below minimum.
    if (input.type !== StockMovementType.IN) {
      void this.maybeEmitLowStock(input.productId);
    }

    return result;
  }

  async findAllWarehouses(
    pagination: PaginationInput,
  ): Promise<IPaginatedType<Warehouse>> {
    const { skip, take } = pagination;
    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.warehouse.count(),
    ]);

    return {
      items,
      meta: { total, skip, take },
    };
  }

  async findAllProducts(
    pagination: PaginationInput,
    search?: string,
  ): Promise<IPaginatedType<Product>> {
    const { skip, take } = pagination;
    const where: Prisma.ProductWhereInput = search
      ? {
          OR: [
            { sku: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      meta: { total, skip, take },
    };
  }

  async findStockMovements(
    pagination: PaginationInput,
    filter?: StockMovementFilterInput,
  ): Promise<StockMovement[]> {
    return this.prisma.stockMovement.findMany({
      where: {
        productId: filter?.productId,
        warehouseId: filter?.warehouseId,
        type: filter?.type,
      },
      include: {
        product: true,
        warehouse: true,
        createdBy: true,
      },
      skip: pagination.skip,
      take: pagination.take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findLowStockProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        currentStock: {
          lte: this.prisma.product.fields.minimumStock,
        },
      },
      orderBy: [{ currentStock: 'asc' }, { name: 'asc' }],
    });
  }

  async reserveStock(
    productId: string,
    warehouseId: string,
    qty: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (qty <= 0) {
      throw new BadRequestException(
        'Quantity to reserve must be greater than 0',
      );
    }

    const run = async (client: Prisma.TransactionClient) => {
      const stock = await client.productStock.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
      });

      const onHand = stock?.quantity ?? 0;
      const alreadyReserved = stock?.reservedQty ?? 0;
      const defective = stock?.defectiveQty ?? 0;
      const available = onHand - alreadyReserved - defective;

      if (available < qty) {
        throw new BadRequestException(
          `Insufficient available stock. Requested: ${qty}, Available: ${available}`,
        );
      }

      await client.productStock.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        update: { reservedQty: alreadyReserved + qty },
        create: {
          productId,
          warehouseId,
          quantity: 0,
          reservedQty: qty,
        },
      });
    };

    if (tx) {
      await run(tx);
    } else {
      await this.prisma.$transaction(run);
    }
  }

  async releaseReservation(
    productId: string,
    warehouseId: string,
    qty: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (qty <= 0) return;

    const run = async (client: Prisma.TransactionClient) => {
      const stock = await client.productStock.findUnique({
        where: { productId_warehouseId: { productId, warehouseId } },
      });
      if (!stock) return;

      const next = Math.max(0, stock.reservedQty - qty);
      await client.productStock.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { reservedQty: next },
      });
    };

    if (tx) {
      await run(tx);
    } else {
      await this.prisma.$transaction(run);
    }
  }

  async issueStock(
    params: {
      productId: string;
      warehouseId: string;
      qty: number;
      unitCost?: number | null;
      reference?: string | null;
      notes?: string | null;
      projectId?: string | null;
      projectMaterialId?: string | null;
      releaseReservedQty?: number;
      performedById: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const {
      productId,
      warehouseId,
      qty,
      unitCost,
      reference,
      notes,
      projectId,
      projectMaterialId,
      releaseReservedQty = 0,
      performedById,
    } = params;

    if (qty <= 0) {
      throw new BadRequestException('Quantity to issue must be greater than 0');
    }

    const run = async (client: Prisma.TransactionClient) => {
      const [stock, product] = await Promise.all([
        client.productStock.findUnique({
          where: { productId_warehouseId: { productId, warehouseId } },
        }),
        client.product.findUnique({ where: { id: productId } }),
      ]);

      const onHand = stock?.quantity ?? 0;
      const defective = stock?.defectiveQty ?? 0;
      const sellable = onHand - defective;
      if (sellable < qty) {
        throw new BadRequestException(
          `Insufficient stock to issue. Requested: ${qty}, Sellable: ${sellable} (on-hand ${onHand}, defective ${defective})`,
        );
      }

      const nextQuantity = onHand - qty;
      const nextReserved = Math.max(
        0,
        (stock?.reservedQty ?? 0) - releaseReservedQty,
      );

      await client.productStock.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { quantity: nextQuantity, reservedQty: nextReserved },
      });

      await this.recomputeProductCurrentStock(productId, client);

      const resolvedUnitCost =
        unitCost ??
        (product?.unitPrice && product.unitPrice > 0
          ? product.unitPrice
          : null);

      return client.stockMovement.create({
        data: {
          productId,
          warehouseId,
          type: StockMovementType.OUT,
          quantity: qty,
          unitCost: resolvedUnitCost,
          reference: reference ?? null,
          notes: notes ?? null,
          createdById: performedById,
          projectId: projectId ?? null,
          projectMaterialId: projectMaterialId ?? null,
        },
      });
    };

    const movement = tx ? await run(tx) : await this.prisma.$transaction(run);
    void this.maybeEmitLowStock(productId);
    return movement;
  }

  async getOverview(): Promise<StockOverview> {
    const [totalProducts, totalWarehouses, lowStockProducts, unitsAggregate] =
      await Promise.all([
        this.prisma.product.count(),
        this.prisma.warehouse.count(),
        this.prisma.product.count({
          where: {
            currentStock: {
              lte: this.prisma.product.fields.minimumStock,
            },
          },
        }),
        this.prisma.product.aggregate({
          _sum: { currentStock: true },
        }),
      ]);

    return {
      totalProducts,
      totalWarehouses,
      lowStockProducts,
      totalStockUnits: unitsAggregate._sum.currentStock ?? 0,
    };
  }

  /**
   * Move units from the healthy bucket into the defective bucket for a given
   * (product, warehouse). Total on-hand stays the same; sellable stock drops.
   * Defective units can later be returned to supplier or scrapped.
   */
  async markDefective(
    input: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason?: string | null;
    },
    performedById: string,
  ): Promise<StockMovement> {
    if (input.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const [product, warehouse] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: input.productId } }),
      this.prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
    ]);
    if (!product) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${input.warehouseId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.productStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
      });

      const onHand = stock?.quantity ?? 0;
      const reserved = stock?.reservedQty ?? 0;
      const defective = stock?.defectiveQty ?? 0;
      const healthyUnreserved = onHand - reserved - defective;

      if (healthyUnreserved < input.quantity) {
        throw new BadRequestException(
          `Cannot mark ${input.quantity} as defective. Healthy unreserved units in ${warehouse.code}: ${healthyUnreserved}`,
        );
      }

      await tx.productStock.update({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        data: { defectiveQty: defective + input.quantity },
      });

      await this.recomputeProductCurrentStock(input.productId, tx);

      const movement = await tx.stockMovement.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: StockMovementType.DEFECT,
          quantity: input.quantity,
          notes: input.reason ?? null,
          createdById: performedById,
        },
        include: {
          product: true,
          warehouse: true,
          createdBy: true,
        },
      });

      // Newly defective units may push sellable stock below the minimum.
      void this.maybeEmitLowStock(input.productId);

      return movement;
    });
  }

  /**
   * Permanently remove units from the defective bucket: decrements both
   * `defectiveQty` and `quantity` by the same amount. Records a SCRAP movement.
   */
  async scrapDefective(
    input: {
      productId: string;
      warehouseId: string;
      quantity: number;
      reason?: string | null;
    },
    performedById: string,
  ): Promise<StockMovement> {
    if (input.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const [product, warehouse] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: input.productId } }),
      this.prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
    ]);
    if (!product) {
      throw new NotFoundException(`Product ${input.productId} not found`);
    }
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${input.warehouseId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.productStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
      });

      const onHand = stock?.quantity ?? 0;
      const defective = stock?.defectiveQty ?? 0;

      if (defective < input.quantity) {
        throw new BadRequestException(
          `Cannot scrap ${input.quantity} units. Defective stock in ${warehouse.code}: ${defective}`,
        );
      }

      await tx.productStock.update({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
        data: {
          quantity: onHand - input.quantity,
          defectiveQty: defective - input.quantity,
        },
      });

      await this.recomputeProductCurrentStock(input.productId, tx);

      return tx.stockMovement.create({
        data: {
          productId: input.productId,
          warehouseId: input.warehouseId,
          type: StockMovementType.SCRAP,
          quantity: input.quantity,
          notes: input.reason ?? null,
          createdById: performedById,
        },
        include: {
          product: true,
          warehouse: true,
          createdBy: true,
        },
      });
    });
  }
}
