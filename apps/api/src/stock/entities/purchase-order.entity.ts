import {
  Field,
  Float,
  ID,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { PurchaseOrderStatus } from '@prisma/client';
import { Partner } from '../../finance/entities/partner.entity';
import { User } from '../../users/entities/user.entity';
import { Warehouse } from './warehouse.entity';
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { PurchaseOrderReceipt } from './purchase-order-receipt.entity';

registerEnumType(PurchaseOrderStatus, {
  name: 'PurchaseOrderStatus',
  description: 'Lifecycle state of a supplier purchase order',
});

@ObjectType()
export class PurchaseOrder {
  @Field(() => ID)
  id: string;

  @Field()
  series: string;

  @Field(() => Int)
  number: number;

  @Field()
  supplierId: string;

  @Field()
  warehouseId: string;

  @Field(() => PurchaseOrderStatus)
  status: PurchaseOrderStatus;

  @Field()
  orderDate: Date;

  @Field(() => Date, { nullable: true })
  expectedDate?: Date | null;

  @Field()
  currency: string;

  @Field(() => Float)
  subtotal: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Date, { nullable: true })
  cancelledAt?: Date | null;

  @Field(() => String, { nullable: true })
  cancelReason?: string | null;

  @Field()
  createdById: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => Partner, { nullable: true })
  supplier?: Partner;

  @Field(() => Warehouse, { nullable: true })
  warehouse?: Warehouse;

  @Field(() => User, { nullable: true })
  createdBy?: User;

  @Field(() => [PurchaseOrderLine], { nullable: true })
  lines?: PurchaseOrderLine[];

  @Field(() => [PurchaseOrderReceipt], { nullable: true })
  receipts?: PurchaseOrderReceipt[];
}
