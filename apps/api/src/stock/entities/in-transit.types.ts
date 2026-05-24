import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({
  description:
    'Aggregated in-transit quantity for one product within a warehouse',
})
export class InTransitRow {
  @Field()
  productId: string;

  @Field(() => String, { nullable: true })
  warehouseId?: string | null;

  @Field()
  supplierId: string;

  @Field()
  supplierName: string;

  @Field(() => Float)
  qtyInTransit: number;

  @Field(() => Date, { nullable: true })
  earliestExpectedDate?: Date | null;

  @Field(() => [ID])
  orderIds: string[];
}

@ObjectType({
  description:
    'Per-product in-transit summary used by stock dashboards (one row per product)',
})
export class InTransitProductSummary {
  @Field()
  productId: string;

  @Field()
  productSku: string;

  @Field()
  productName: string;

  @Field(() => Float)
  qtyInTransit: number;

  @Field(() => Int)
  openOrderCount: number;

  @Field(() => Date, { nullable: true })
  earliestExpectedDate?: Date | null;
}
