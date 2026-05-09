import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class InvoiceLineDraft {
  @Field()
  description: string;

  @Field(() => Float)
  quantity: number;

  @Field()
  unit: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  vatRate: number;

  @Field()
  source: string;
}
