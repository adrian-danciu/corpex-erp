import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { ProductStock } from './product-stock.entity';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  sku: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  unit: string;

  @Field(() => String, { nullable: true })
  category?: string | null;

  @Field()
  minimumStock: number;

  @Field()
  currentStock: number;

  @Field(() => Float)
  unitPrice: number;

  @Field()
  isActive: boolean;

  @Field(() => [ProductStock], { nullable: true })
  warehouses?: ProductStock[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
