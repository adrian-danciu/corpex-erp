import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Product } from './product.entity';
import { Warehouse } from './warehouse.entity';

@ObjectType()
export class ProductStock {
  @Field(() => ID)
  id: string;

  @Field()
  productId: string;

  @Field()
  warehouseId: string;

  @Field()
  quantity: number;

  @Field(() => Product)
  product: Product;

  @Field(() => Warehouse)
  warehouse: Warehouse;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
