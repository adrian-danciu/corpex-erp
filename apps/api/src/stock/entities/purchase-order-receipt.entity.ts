import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { PurchaseOrderReceiptLine } from './purchase-order-receipt-line.entity';

@ObjectType()
export class PurchaseOrderReceipt {
  @Field(() => ID)
  id: string;

  @Field()
  orderId: string;

  @Field()
  nirSeries: string;

  @Field(() => Int)
  nirNumber: number;

  @Field()
  receivedDate: Date;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdById: string;

  @Field()
  createdAt: Date;

  @Field(() => User, { nullable: true })
  createdBy?: User;

  @Field(() => [PurchaseOrderReceiptLine], { nullable: true })
  lines?: PurchaseOrderReceiptLine[];
}
