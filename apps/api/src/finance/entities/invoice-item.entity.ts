import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class InvoiceItem {
  @Field(() => ID)
  id: string;

  @Field()
  invoiceId: string;

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

  @Field(() => Float)
  amount: number;

  @Field(() => Float)
  vatAmount: number;
}
