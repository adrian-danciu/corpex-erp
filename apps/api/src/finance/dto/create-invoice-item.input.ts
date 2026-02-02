import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateInvoiceItemInput {
  @Field()
  description: string;

  @Field(() => Float)
  quantity: number;

  @Field({ defaultValue: 'buc' })
  unit: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float, { defaultValue: 19 })
  vatRate: number;
}
