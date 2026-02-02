import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import { PaymentMethod } from '@prisma/client';
import { User } from '../../users/entities/user.entity';

registerEnumType(PaymentMethod, {
  name: 'PaymentMethod',
  description: 'Method of payment',
});

@ObjectType()
export class Payment {
  @Field(() => ID)
  id: string;

  @Field()
  invoiceId: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Date)
  paymentDate: Date;

  @Field(() => PaymentMethod)
  paymentMethod: PaymentMethod;

  @Field(() => String, { nullable: true })
  reference?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdById: string;

  @Field(() => User)
  createdBy: User;

  @Field(() => Date)
  createdAt: Date;
}
