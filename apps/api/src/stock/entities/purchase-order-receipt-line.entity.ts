import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { PurchaseOrderLine } from './purchase-order-line.entity';

@ObjectType()
export class PurchaseOrderReceiptLine {
  @Field(() => ID)
  id: string;

  @Field()
  receiptId: string;

  @Field()
  orderLineId: string;

  @Field(() => Float)
  qtyReceived: number;

  @Field(() => Float, { nullable: true })
  invoicedQty?: number;

  @Field(() => Float, { nullable: true })
  remainingInvoiceQty?: number;

  @Field(() => PurchaseOrderLine, { nullable: true })
  orderLine?: PurchaseOrderLine;
}
