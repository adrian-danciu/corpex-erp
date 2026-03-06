import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductInput } from './dto/create-product.input';
import { CreateStockMovementInput } from './dto/create-stock-movement.input';
import { CreateWarehouseInput } from './dto/create-warehouse.input';
import { StockMovementFilterInput } from './dto/stock-movement-filter.input';
import { Product } from './entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockOverview } from './entities/stock-overview.type';
import { Warehouse } from './entities/warehouse.entity';

@Injectable()
export class StockService {
  constructor(private readonly prisma: PrismaService) {}

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
      throw new ConflictException(`Product with SKU ${input.sku} already exists`);
    }

    return this.prisma.product.create({
      data: {
        sku: input.sku,
        name: input.name,
        description: input.description,
        unit: input.unit || 'pcs',
        category: input.category,
        minimumStock: input.minimumStock ?? 0,
      },
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
      throw new NotFoundException(`Product with ID ${input.productId} not found`);
    }

    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID ${input.warehouseId} not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const currentStock = await tx.productStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
      });

      const previousQuantity = currentStock?.quantity ?? 0;
      let nextQuantity = previousQuantity;

      if (input.type === StockMovementType.IN) {
        nextQuantity = previousQuantity + input.quantity;
      } else if (input.type === StockMovementType.OUT) {
        if (previousQuantity < input.quantity) {
          throw new BadRequestException(
            `Insufficient stock in warehouse ${warehouse.code}. Available: ${previousQuantity}`,
          );
        }
        nextQuantity = previousQuantity - input.quantity;
      } else {
        if (input.quantity < 0) {
          throw new BadRequestException('Adjusted quantity cannot be negative');
        }
        nextQuantity = input.quantity;
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

      const aggregate = await tx.productStock.aggregate({
        where: { productId: input.productId },
        _sum: { quantity: true },
      });

      await tx.product.update({
        where: { id: input.productId },
        data: {
          currentStock: aggregate._sum.quantity ?? 0,
        },
      });

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
}
