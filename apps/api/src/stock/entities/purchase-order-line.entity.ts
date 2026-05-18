import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Product } from './product.entity';

@ObjectType()
export class PurchaseOrderLine {
  @Field(() => ID)
  id: string;

  @Field()
  orderId: string;

  @Field()
  productId: string;

  @Field(() => Float)
  qtyOrdered: number;

  @Field(() => Float)
  qtyReceived: number;

  @Field(() => Float)
  unitCost: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Product, { nullable: true })
  product?: Product;
}
