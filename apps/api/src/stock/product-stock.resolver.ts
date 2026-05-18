import { Float, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ProductStock } from './entities/product-stock.entity';
import { PurchaseOrdersService } from './purchase-orders.service';

@Resolver(() => ProductStock)
export class ProductStockResolver {
  constructor(private readonly purchaseOrders: PurchaseOrdersService) {}

  @ResolveField(() => Float, {
    description:
      'Sellable, unreserved units: quantity - reservedQty - defectiveQty',
  })
  availableQty(@Parent() stock: ProductStock): number {
    const onHand = stock.quantity ?? 0;
    const reserved = stock.reservedQty ?? 0;
    const defective = stock.defectiveQty ?? 0;
    return Math.max(0, onHand - reserved - defective);
  }

  @ResolveField(() => Float, {
    description: 'Outstanding quantity across open POs for this product/warehouse',
  })
  async inTransitQty(@Parent() stock: ProductStock): Promise<number> {
    return this.purchaseOrders.inTransitForProductStock(
      stock.productId,
      stock.warehouseId,
    );
  }
}
