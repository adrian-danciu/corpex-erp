import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StockOverview {
  @Field(() => Int)
  totalProducts: number;

  @Field(() => Int)
  totalWarehouses: number;

  @Field(() => Int)
  lowStockProducts: number;

  @Field()
  totalStockUnits: number;
}
