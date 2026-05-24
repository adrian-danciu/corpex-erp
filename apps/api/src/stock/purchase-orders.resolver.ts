import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginationInput } from '../common/dto/pagination.input';
import { normalizePagination } from '../common/pagination';
import { User } from '../users/entities/user.entity';
import { PaginatedPurchaseOrder } from './dto/paginated-purchase-order.dto';
import {
  CreatePurchaseOrderInput,
  PurchaseOrderFilterInput,
  RecordReceiptInput,
  UpdatePurchaseOrderInput,
} from './dto/purchase-order.inputs';
import {
  InTransitProductSummary,
  InTransitRow,
} from './entities/in-transit.types';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderReceipt } from './entities/purchase-order-receipt.entity';
import { PurchaseOrdersService } from './purchase-orders.service';

@Resolver()
@UseGuards(JwtAuthGuard, DepartmentGuard)
export class PurchaseOrdersResolver {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Query(() => PaginatedPurchaseOrder, { name: 'purchaseOrders' })
  @RequireModule('stock', 'read')
  async purchaseOrders(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
    @Args('filter', { nullable: true }) filter?: PurchaseOrderFilterInput,
  ): Promise<PaginatedPurchaseOrder> {
    return this.service.list(normalizePagination(pagination, 20), filter);
  }

  @Query(() => PurchaseOrder, { name: 'purchaseOrder' })
  @RequireModule('stock', 'read')
  async purchaseOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PurchaseOrder> {
    return this.service.getById(id);
  }

  @Query(() => [InTransitRow], { name: 'inTransitByProduct' })
  @RequireModule('stock', 'read')
  async inTransitByProduct(
    @Args('productId', { type: () => ID }) productId: string,
    @Args('warehouseId', { type: () => ID, nullable: true })
    warehouseId?: string,
  ): Promise<InTransitRow[]> {
    return this.service.inTransitByProduct(productId, warehouseId);
  }

  @Query(() => [InTransitProductSummary], { name: 'inTransitSummary' })
  @RequireModule('stock', 'read')
  async inTransitSummary(
    @Args('warehouseId', { type: () => ID, nullable: true })
    warehouseId?: string,
  ): Promise<InTransitProductSummary[]> {
    return this.service.inTransitSummary(warehouseId);
  }

  @Mutation(() => PurchaseOrder)
  @RequireModule('stock', 'write')
  async createPurchaseOrder(
    @Args('input') input: CreatePurchaseOrderInput,
    @CurrentUser() user: User,
  ): Promise<PurchaseOrder> {
    return this.service.create(input, user.id);
  }

  @Mutation(() => PurchaseOrder)
  @RequireModule('stock', 'write')
  async updatePurchaseOrder(
    @Args('input') input: UpdatePurchaseOrderInput,
  ): Promise<PurchaseOrder> {
    return this.service.update(input);
  }

  @Mutation(() => PurchaseOrder)
  @RequireModule('stock', 'write')
  async confirmPurchaseOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PurchaseOrder> {
    return this.service.confirm(id);
  }

  @Mutation(() => PurchaseOrder)
  @RequireModule('stock', 'write')
  async cancelPurchaseOrder(
    @Args('id', { type: () => ID }) id: string,
    @Args('reason', { nullable: true }) reason?: string,
  ): Promise<PurchaseOrder> {
    return this.service.cancel(id, reason);
  }

  @Mutation(() => PurchaseOrderReceipt)
  @RequireModule('stock', 'write')
  async recordPurchaseOrderReceipt(
    @Args('input') input: RecordReceiptInput,
    @CurrentUser() user: User,
  ): Promise<PurchaseOrderReceipt> {
    return this.service.recordReceipt(input, user.id);
  }

  @Mutation(() => Boolean)
  @RequireModule('stock', 'write')
  async deletePurchaseOrder(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.service.delete(id);
  }
}
