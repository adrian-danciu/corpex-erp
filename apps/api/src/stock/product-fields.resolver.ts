import {
  Args,
  Float,
  ID,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Product } from './entities/product.entity';
import { PurchaseOrdersService } from './purchase-orders.service';

@Resolver(() => Product)
export class ProductFieldsResolver {
  constructor(private readonly purchaseOrders: PurchaseOrdersService) {}

  @ResolveField(() => Float, {
    description: 'Sum of qtyOrdered - qtyReceived across open purchase orders',
  })
  async inTransitQty(
    @Parent() product: Product,
    @Args('warehouseId', { type: () => ID, nullable: true })
    warehouseId?: string,
  ): Promise<number> {
    return this.purchaseOrders.inTransitForProduct(product.id, warehouseId);
  }

  @ResolveField(() => Float, {
    description:
      'Projected available stock: currentStock - reserved across warehouses + in-transit',
  })
  async availableForOrder(@Parent() product: Product): Promise<number> {
    const inTransit = await this.purchaseOrders.inTransitForProduct(product.id);
    const onHand = product.currentStock ?? 0;
    return onHand + inTransit;
  }
}
