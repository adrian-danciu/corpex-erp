import { InputType, Field, Float } from '@nestjs/graphql';
import { PaymentMethod } from '@prisma/client';

@InputType()
export class CreatePaymentInput {
  @Field()
  invoiceId: string;

  @Field(() => Float)
  amount: number;

  @Field()
  paymentDate: Date;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field({ nullable: true })
  reference?: string;

  @Field({ nullable: true })
  notes?: string;
}
