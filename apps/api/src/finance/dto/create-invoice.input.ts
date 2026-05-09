import { InputType, Field } from '@nestjs/graphql';
import { InvoiceType } from '@prisma/client';
import { CreateInvoiceItemInput } from './create-invoice-item.input';

@InputType()
export class CreateInvoiceInput {
  @Field({ defaultValue: 'CORP' })
  series: string;

  @Field(() => InvoiceType)
  invoiceType: InvoiceType;

  @Field()
  partnerId: string;

  @Field({ defaultValue: true })
  isClientInvoice: boolean;

  @Field()
  issueDate: Date;

  @Field()
  dueDate: Date;

  @Field({ nullable: true })
  deliveryDate?: Date;

  @Field({ defaultValue: 'RON' })
  currency: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => String, { nullable: true })
  projectId?: string;

  @Field(() => [CreateInvoiceItemInput])
  items: CreateInvoiceItemInput[];
}
