import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { PurchaseOrderStatus } from '@prisma/client';

@InputType()
export class CreatePurchaseOrderLineInput {
  @Field(() => ID)
  productId: string;

  @Field(() => Float)
  qtyOrdered: number;

  @Field(() => Float)
  unitCost: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class CreatePurchaseOrderInput {
  @Field(() => ID)
  supplierId: string;

  @Field(() => ID)
  warehouseId: string;

  @Field(() => Date, { nullable: true })
  expectedDate?: Date;

  @Field(() => String, { nullable: true })
  currency?: string;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => [CreatePurchaseOrderLineInput])
  lines: CreatePurchaseOrderLineInput[];
}

@InputType()
export class UpdatePurchaseOrderInput {
  @Field(() => ID)
  id: string;

  @Field(() => ID, { nullable: true })
  supplierId?: string;

  @Field(() => ID, { nullable: true })
  warehouseId?: string;

  @Field(() => Date, { nullable: true })
  expectedDate?: Date;

  @Field(() => String, { nullable: true })
  currency?: string;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => [CreatePurchaseOrderLineInput], { nullable: true })
  lines?: CreatePurchaseOrderLineInput[];
}

@InputType()
export class ReceiptLineInput {
  @Field(() => ID)
  orderLineId: string;

  @Field(() => Float)
  qtyReceived: number;
}

@InputType()
export class RecordReceiptInput {
  @Field(() => ID)
  orderId: string;

  @Field(() => Date, { nullable: true })
  receivedDate?: Date;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => [ReceiptLineInput])
  lines: ReceiptLineInput[];
}

@InputType()
export class PurchaseOrderFilterInput {
  @Field(() => [PurchaseOrderStatus], { nullable: true })
  status?: PurchaseOrderStatus[];

  @Field(() => ID, { nullable: true })
  supplierId?: string;

  @Field(() => ID, { nullable: true })
  warehouseId?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Matches PO number prefix or supplier name (case-insensitive)',
  })
  search?: string;
}
