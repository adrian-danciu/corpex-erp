import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
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

  @Field()
  reservedQty: number;

  @Field()
  defectiveQty: number;

  @Field(() => Float)
  availableQty: number;

  @Field(() => Product, { nullable: true })
  product?: Product;

  @Field(() => Warehouse)
  warehouse: Warehouse;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
