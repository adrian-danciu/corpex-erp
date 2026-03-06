import { Field, InputType } from '@nestjs/graphql';
import { StockMovementType } from '@prisma/client';

@InputType()
export class StockMovementFilterInput {
  @Field({ nullable: true })
  productId?: string;

  @Field({ nullable: true })
  warehouseId?: string;

  @Field(() => StockMovementType, { nullable: true })
  type?: StockMovementType;
}
