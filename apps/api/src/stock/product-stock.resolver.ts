import { Float, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ProductStock } from './entities/product-stock.entity';

@Resolver(() => ProductStock)
export class ProductStockResolver {
  @ResolveField(() => Float, {
    description: 'Quantity on hand minus reserved quantity',
  })
  availableQty(@Parent() stock: ProductStock): number {
    const onHand = stock.quantity ?? 0;
    const reserved = stock.reservedQty ?? 0;
    return Math.max(0, onHand - reserved);
  }
}
