import { InputType, Field, Float } from '@nestjs/graphql';
import { InvoiceItemSourceType } from '@prisma/client';

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

  @Field(() => String, { nullable: true })
  projectId?: string;

  @Field(() => InvoiceItemSourceType, { nullable: true })
  sourceType?: InvoiceItemSourceType;

  @Field(() => String, { nullable: true })
  sourceId?: string;
}
