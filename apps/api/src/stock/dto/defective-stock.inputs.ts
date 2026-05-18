import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class MarkStockDefectiveInput {
  @Field()
  productId: string;

  @Field()
  warehouseId: string;

  @Field(() => Float)
  quantity: number;

  @Field({ nullable: true })
  reason?: string;
}

@InputType()
export class ScrapDefectiveStockInput {
  @Field()
  productId: string;

  @Field()
  warehouseId: string;

  @Field(() => Float)
  quantity: number;

  @Field({ nullable: true })
  reason?: string;
}
