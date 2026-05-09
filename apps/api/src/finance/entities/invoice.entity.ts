import {
  ObjectType,
  Field,
  ID,
  Float,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { InvoiceType, InvoiceStatus } from '@prisma/client';
import { Partner } from './partner.entity';
import { InvoiceItem } from './invoice-item.entity';
import { Payment } from './payment.entity';
import { User } from '../../users/entities/user.entity';

registerEnumType(InvoiceType, {
  name: 'InvoiceType',
  description: 'Type of invoice',
});

registerEnumType(InvoiceStatus, {
  name: 'InvoiceStatus',
  description: 'Status of an invoice',
});

@ObjectType()
export class Invoice {
  @Field(() => ID)
  id: string;

  @Field()
  series: string;

  @Field(() => Int)
  number: number;

  @Field(() => InvoiceType)
  invoiceType: InvoiceType;

  @Field(() => InvoiceStatus)
  status: InvoiceStatus;

  @Field()
  partnerId: string;

  @Field(() => Partner)
  partner: Partner;

  @Field(() => String, { nullable: true })
  supplierId?: string | null;

  @Field(() => Partner, { nullable: true })
  supplier?: Partner | null;

  @Field()
  isClientInvoice: boolean;

  @Field(() => Date)
  issueDate: Date;

  @Field(() => Date)
  dueDate: Date;

  @Field(() => Date, { nullable: true })
  deliveryDate?: Date | null;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  vatTotal: number;

  @Field(() => Float)
  total: number;

  @Field(() => Float)
  paidAmount: number;

  @Field()
  currency: string;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdById: string;

  @Field(() => User)
  createdBy: User;

  @Field(() => [InvoiceItem])
  items: InvoiceItem[];

  @Field(() => [Payment])
  payments: Payment[];

  @Field(() => String, { nullable: true })
  projectId?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
