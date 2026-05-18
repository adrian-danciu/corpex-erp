import { Float, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { PurchaseOrderReceipt } from './entities/purchase-order-receipt.entity';

const pad = (n: number) => n.toString().padStart(6, '0');

@Resolver(() => PurchaseOrder)
export class PurchaseOrderFieldsResolver {
  @ResolveField(() => String, {
    description: 'Display number like "PO-000123"',
  })
  formattedNumber(@Parent() order: PurchaseOrder): string {
    return `${order.series}-${pad(order.number)}`;
  }
}

@Resolver(() => PurchaseOrderLine)
export class PurchaseOrderLineFieldsResolver {
  @ResolveField(() => Float, {
    description: 'qtyOrdered - qtyReceived (never negative)',
  })
  qtyOutstanding(@Parent() line: PurchaseOrderLine): number {
    return Math.max(0, (line.qtyOrdered ?? 0) - (line.qtyReceived ?? 0));
  }
}

@Resolver(() => PurchaseOrderReceipt)
export class PurchaseOrderReceiptFieldsResolver {
  @ResolveField(() => String, {
    description: 'Display number like "NIR-000045"',
  })
  formattedNumber(@Parent() receipt: PurchaseOrderReceipt): string {
    return `${receipt.nirSeries}-${pad(receipt.nirNumber)}`;
  }
}
