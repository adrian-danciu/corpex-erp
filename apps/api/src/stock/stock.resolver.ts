import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequireModule, Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationInput } from '../common/dto/pagination.input';
import { normalizePagination } from '../common/pagination';
import { User } from '../users/entities/user.entity';
import { CreateProductInput } from './dto/create-product.input';
import {
  MarkStockDefectiveInput,
  ScrapDefectiveStockInput,
} from './dto/defective-stock.inputs';
import { UpdateProductInput } from './dto/update-product.input';
import { CreateStockMovementInput } from './dto/create-stock-movement.input';
import { CreateWarehouseInput } from './dto/create-warehouse.input';
import { PaginatedProduct } from './dto/paginated-product.dto';
import { PaginatedWarehouse } from './dto/paginated-warehouse.dto';
import { StockMovementFilterInput } from './dto/stock-movement-filter.input';
import { Product } from './entities/product.entity';
import { ProductStock } from './entities/product-stock.entity';
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
    return this.stockService.findAllWarehouses(normalizePagination(pagination));
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
    return this.stockService.findAllProducts(
      normalizePagination(pagination),
      search,
    );
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
    return this.stockService.findStockMovements(
      normalizePagination(pagination, 20),
      filter,
    );
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

  @Mutation(() => Product, { description: 'Update an existing product' })
  @RequireModule('stock', 'write')
  async updateProduct(
    @Args('input') input: UpdateProductInput,
  ): Promise<Product> {
    return this.stockService.updateProduct(input);
  }

  @Query(() => [ProductStock], {
    name: 'productStockByProduct',
    description: 'Per-warehouse stock breakdown for a product',
  })
  @RequireModule('stock', 'read')
  async getProductStockByProduct(
    @Args('productId') productId: string,
  ): Promise<ProductStock[]> {
    return this.stockService.productStockByProduct(productId) as Promise<
      ProductStock[]
    >;
  }

  @Mutation(() => StockMovement, {
    description: 'Register an admin-only stock adjustment',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @RequireModule('stock', 'write')
  async createStockMovement(
    @Args('createStockMovementInput') input: CreateStockMovementInput,
    @CurrentUser() user: User,
  ): Promise<StockMovement> {
    return this.stockService.createStockMovement(input, user.id);
  }

  @Mutation(() => StockMovement, {
    description:
      'Mark units of a product in a warehouse as defective (does not remove them from stock)',
  })
  @RequireModule('stock', 'write')
  async markStockDefective(
    @Args('input') input: MarkStockDefectiveInput,
    @CurrentUser() user: User,
  ): Promise<StockMovement> {
    return this.stockService.markDefective(input, user.id);
  }

  @Mutation(() => StockMovement, {
    description: 'Permanently scrap defective units from a warehouse',
  })
  @RequireModule('stock', 'write')
  async scrapDefectiveStock(
    @Args('input') input: ScrapDefectiveStockInput,
    @CurrentUser() user: User,
  ): Promise<StockMovement> {
    return this.stockService.scrapDefective(input, user.id);
  }
}
