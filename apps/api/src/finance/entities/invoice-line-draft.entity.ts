import { Field, Float, ObjectType } from '@nestjs/graphql';
import { InvoiceItemSourceType } from '@prisma/client';

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

  @Field(() => InvoiceItemSourceType)
  sourceType: InvoiceItemSourceType;

  @Field()
  sourceId: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  vatAmount: number;

  @Field(() => Float)
  total: number;
}
