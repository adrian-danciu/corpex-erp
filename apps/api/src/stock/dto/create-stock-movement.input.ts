import { Field, Float, InputType } from '@nestjs/graphql';
import { StockMovementType } from '@prisma/client';

@InputType()
export class CreateStockMovementInput {
  @Field()
  productId: string;

  @Field()
  warehouseId: string;

  @Field(() => StockMovementType)
  type: StockMovementType;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float, { nullable: true })
  unitCost?: number;

  @Field({ nullable: true })
  reference?: string;

  @Field({ nullable: true })
  notes?: string;
}
