import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { PaginationInput } from '../common/dto/pagination.input';
import { User } from '../users/entities/user.entity';
import { CreateProductInput } from './dto/create-product.input';
import { CreateStockMovementInput } from './dto/create-stock-movement.input';
import { CreateWarehouseInput } from './dto/create-warehouse.input';
import { PaginatedProduct } from './dto/paginated-product.dto';
import { PaginatedWarehouse } from './dto/paginated-warehouse.dto';
import { StockMovementFilterInput } from './dto/stock-movement-filter.input';
import { Product } from './entities/product.entity';
import { StockMovement } from './entities/stock-movement.entity';
import { StockOverview } from './entities/stock-overview.type';
import { Warehouse } from './entities/warehouse.entity';
import { StockService } from './stock.service';

@Resolver()
@UseGuards(JwtAuthGuard, DepartmentGuard)
export class StockResolver {
  constructor(private readonly stockService: StockService) {}

  @Query(() => PaginatedWarehouse, {
    name: 'warehouses',
    description: 'Get all warehouses (paginated)',
  })
  @RequireModule('stock', 'read')
  async getWarehouses(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
  ): Promise<PaginatedWarehouse> {
    const paginationInput = pagination || { skip: 0, take: 10 };
    return this.stockService.findAllWarehouses(paginationInput);
  }

  @Query(() => PaginatedProduct, {
    name: 'products',
    description: 'Get all products (paginated)',
  })
  @RequireModule('stock', 'read')
  async getProducts(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
    @Args('search', { nullable: true }) search?: string,
  ): Promise<PaginatedProduct> {
    const paginationInput = pagination || { skip: 0, take: 10 };
    return this.stockService.findAllProducts(paginationInput, search);
  }

  @Query(() => [Product], {
    name: 'lowStockProducts',
    description: 'Get products below minimum stock',
  })
  @RequireModule('stock', 'read')
  async getLowStockProducts(): Promise<Product[]> {
    return this.stockService.findLowStockProducts();
  }

  @Query(() => [StockMovement], {
    name: 'stockMovements',
    description: 'Get stock movements by optional filters',
  })
  @RequireModule('stock', 'read')
  async getStockMovements(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
    @Args('filter', { nullable: true, type: () => StockMovementFilterInput })
    filter?: StockMovementFilterInput,
  ): Promise<StockMovement[]> {
    const paginationInput = pagination || { skip: 0, take: 20 };
    return this.stockService.findStockMovements(paginationInput, filter);
  }

  @Query(() => StockOverview, {
    name: 'stockOverview',
    description: 'Inventory overview KPIs',
  })
  @RequireModule('stock', 'read')
  async getStockOverview(): Promise<StockOverview> {
    return this.stockService.getOverview();
  }

  @Mutation(() => Warehouse, { description: 'Create a new warehouse' })
  @RequireModule('stock', 'write')
  async createWarehouse(
    @Args('createWarehouseInput') input: CreateWarehouseInput,
  ): Promise<Warehouse> {
    return this.stockService.createWarehouse(input);
  }

  @Mutation(() => Product, { description: 'Create a new product' })
  @RequireModule('stock', 'write')
  async createProduct(
    @Args('createProductInput') input: CreateProductInput,
  ): Promise<Product> {
    return this.stockService.createProduct(input);
  }

  @Mutation(() => StockMovement, {
    description: 'Register an incoming/outgoing stock movement',
  })
  @RequireModule('stock', 'write')
  async createStockMovement(
    @Args('createStockMovementInput') input: CreateStockMovementInput,
    @CurrentUser() user: User,
  ): Promise<StockMovement> {
    return this.stockService.createStockMovement(input, user.id);
  }
}
