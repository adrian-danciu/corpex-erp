import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RecordReceiptInput } from './dto/purchase-order.inputs';
import { PurchaseOrderReceipt } from './entities/purchase-order-receipt.entity';

const OPEN_STATUSES: PurchaseOrderStatus[] = [
  PurchaseOrderStatus.ORDERED,
  PurchaseOrderStatus.PARTIALLY_RECEIVED,
];

@Injectable()
export class PurchaseOrderReceivingService {
  constructor(private readonly prisma: PrismaService) {}

  async recordReceipt(
    input: RecordReceiptInput,
    createdById: string,
  ): Promise<PurchaseOrderReceipt> {
    if (!input.lines || input.lines.length === 0) {
      throw new BadRequestException('Receipt must include at least one line');
    }
    for (const line of input.lines) {
      if (line.qtyReceived <= 0) {
        throw new BadRequestException(
          'Each receipt line must have qtyReceived greater than 0',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: input.orderId },
        include: { lines: true },
      });
      if (!order) {
        throw new NotFoundException(
          `Purchase order ${input.orderId} not found`,
        );
      }
      if (!OPEN_STATUSES.includes(order.status)) {
        throw new BadRequestException(
          `Cannot record a receipt against a ${order.status} purchase order`,
        );
      }

      const orderLineById = new Map(order.lines.map((l) => [l.id, l]));
      for (const line of input.lines) {
        const orderLine = orderLineById.get(line.orderLineId);
        if (!orderLine) {
          throw new NotFoundException(
            `Order line ${line.orderLineId} does not belong to PO ${order.id}`,
          );
        }
        const outstanding = orderLine.qtyOrdered - orderLine.qtyReceived;
        if (line.qtyReceived > outstanding + 1e-6) {
          throw new BadRequestException(
            `Over-receipt on line ${orderLine.id}: outstanding ${outstanding}, attempted ${line.qtyReceived}`,
          );
        }
      }

      const receipt = await tx.purchaseOrderReceipt.create({
        data: {
          orderId: order.id,
          receivedDate: input.receivedDate ?? new Date(),
          notes: input.notes ?? null,
          createdById,
          lines: {
            create: input.lines.map((l) => ({
              orderLineId: l.orderLineId,
              qtyReceived: l.qtyReceived,
            })),
          },
        },
        include: {
          createdBy: true,
          lines: { include: { orderLine: { include: { product: true } } } },
        },
      });

      const productIdsTouched = new Set<string>();
      for (const receiptLine of receipt.lines) {
        const orderLine = receiptLine.orderLine;
        productIdsTouched.add(orderLine.productId);

        await tx.purchaseOrderLine.update({
          where: { id: orderLine.id },
          data: { qtyReceived: { increment: receiptLine.qtyReceived } },
        });

        await tx.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: orderLine.productId,
              warehouseId: order.warehouseId,
            },
          },
          update: { quantity: { increment: receiptLine.qtyReceived } },
          create: {
            productId: orderLine.productId,
            warehouseId: order.warehouseId,
            quantity: receiptLine.qtyReceived,
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: orderLine.productId,
            warehouseId: order.warehouseId,
            type: StockMovementType.IN,
            quantity: receiptLine.qtyReceived,
            unitCost: orderLine.unitCost,
            reference: `PO-${order.number} / NIR-${receipt.nirNumber}`,
            performedAt: receipt.receivedDate,
            createdById,
            purchaseReceiptLineId: receiptLine.id,
          },
        });
      }

      for (const productId of productIdsTouched) {
        const aggregate = await tx.productStock.aggregate({
          where: { productId },
          _sum: { quantity: true },
        });
        await tx.product.update({
          where: { id: productId },
          data: { currentStock: aggregate._sum.quantity ?? 0 },
        });
      }

      const refreshedLines = await tx.purchaseOrderLine.findMany({
        where: { orderId: order.id },
      });
      const fullyReceived = refreshedLines.every(
        (l) => l.qtyReceived >= l.qtyOrdered - 1e-6,
      );
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: fullyReceived
            ? PurchaseOrderStatus.FULLY_RECEIVED
            : PurchaseOrderStatus.PARTIALLY_RECEIVED,
        },
      });

      return receipt;
    });
  }
}
