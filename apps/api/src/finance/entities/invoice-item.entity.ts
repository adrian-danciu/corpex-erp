import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { InvoiceItemSourceType } from '@prisma/client';

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

  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => InvoiceItemSourceType, { nullable: true })
  sourceType?: InvoiceItemSourceType | null;

  @Field(() => String, { nullable: true })
  sourceId?: string | null;
}
