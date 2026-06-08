import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockMovementInput } from './dto/create-stock-movement.input';
import { StockMovement } from './entities/stock-movement.entity';

interface DefectiveStockInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason?: string | null;
}

interface IssueStockParams {
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
}

@Injectable()
export class StockLedgerService {
  private readonly logger = new Logger(StockLedgerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Recompute `Product.currentStock` as sellable on-hand:
   * SUM(quantity - defectiveQty).
   */
  async recomputeProductCurrentStock(
    productId: string,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const agg = await tx.productStock.aggregate({
      where: { productId },
      _sum: { quantity: true, defectiveQty: true },
    });
    const sellable = (agg._sum.quantity ?? 0) - (agg._sum.defectiveQty ?? 0);
    await tx.product.update({
      where: { id: productId },
      data: { currentStock: sellable },
    });
    return sellable;
  }

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

  async createStockMovement(
    input: CreateStockMovementInput,
    createdById: string,
  ): Promise<StockMovement> {
    if (input.quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }
    if (
      input.quantity === 0 &&
      input.type !== StockMovementType.ADJUSTMENT
    ) {
      throw new BadRequestException(
        'Quantity must be greater than 0 for non-adjustment movements',
      );
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
      const reservedQty = currentStock?.reservedQty ?? 0;
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
        const protectedQuantity = defectiveQty + reservedQty;
        if (input.quantity < protectedQuantity) {
          throw new BadRequestException(
            `Cannot adjust below protected quantity (${protectedQuantity}: ${defectiveQty} defective + ${reservedQty} reserved). Resolve defective units or reservations first.`,
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

    if (input.type !== StockMovementType.IN) {
      void this.maybeEmitLowStock(input.productId);
    }

    return result;
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

  async issueStock(params: IssueStockParams, tx?: Prisma.TransactionClient) {
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

  async markDefective(
    input: DefectiveStockInput,
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

      void this.maybeEmitLowStock(input.productId);

      return movement;
    });
  }

  async scrapDefective(
    input: DefectiveStockInput,
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
