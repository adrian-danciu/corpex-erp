import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { toPaginatedResult } from '../common/pagination';
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
import { StockLedgerService } from './stock-ledger.service';

@Injectable()
export class StockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly ledger = new StockLedgerService(prisma, notifications),
  ) {}

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
    return this.ledger.createStockMovement(input, createdById);
  }

  async findAllWarehouses(
    pagination: PaginationInput,
  ): Promise<IPaginatedType<Warehouse>> {
    const [items, total] = await Promise.all([
      this.prisma.warehouse.findMany({
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.warehouse.count(),
    ]);

    return toPaginatedResult(items, total, pagination);
  }

  async findAllProducts(
    pagination: PaginationInput,
    search?: string,
  ): Promise<IPaginatedType<Product>> {
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
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return toPaginatedResult(items, total, pagination);
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
    return this.ledger.reserveStock(productId, warehouseId, qty, tx);
  }

  async releaseReservation(
    productId: string,
    warehouseId: string,
    qty: number,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    return this.ledger.releaseReservation(productId, warehouseId, qty, tx);
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
    return this.ledger.issueStock(params, tx);
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
    return this.ledger.markDefective(input, performedById);
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
    return this.ledger.scrapDefective(input, performedById);
  }
}
