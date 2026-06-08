import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceItemSourceType,
  InvoiceStatus,
  PartnerType,
  Prisma,
  PurchaseOrderStatus,
} from '@prisma/client';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { toPaginatedResult } from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePurchaseOrderInput,
  CreatePurchaseOrderLineInput,
  PurchaseOrderFilterInput,
  RecordReceiptInput,
  UpdatePurchaseOrderInput,
} from './dto/purchase-order.inputs';
import {
  InTransitProductSummary,
  InTransitRow,
} from './entities/in-transit.types';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderReceipt } from './entities/purchase-order-receipt.entity';
import { PurchaseOrderReceivingService } from './purchase-order-receiving.service';

const OPEN_STATUSES: PurchaseOrderStatus[] = [
  PurchaseOrderStatus.ORDERED,
  PurchaseOrderStatus.PARTIALLY_RECEIVED,
];

const DEFAULT_INCLUDE = {
  supplier: true,
  warehouse: true,
  createdBy: true,
  lines: {
    include: { product: true },
    orderBy: { id: 'asc' } as const,
  },
  receipts: {
    include: {
      createdBy: true,
      lines: { include: { orderLine: { include: { product: true } } } },
    },
    orderBy: { createdAt: 'desc' } as const,
  },
} satisfies Prisma.PurchaseOrderInclude;

type PurchaseOrderWithDefaultInclude = Prisma.PurchaseOrderGetPayload<{
  include: typeof DEFAULT_INCLUDE;
}>;

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiving: PurchaseOrderReceivingService,
  ) {}

  async list(
    pagination: PaginationInput,
    filter?: PurchaseOrderFilterInput,
  ): Promise<IPaginatedType<PurchaseOrder>> {
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (filter?.status && filter.status.length > 0) {
      where.status = { in: filter.status };
    }
    if (filter?.supplierId) where.supplierId = filter.supplierId;
    if (filter?.warehouseId) where.warehouseId = filter.warehouseId;

    if (filter?.search?.trim()) {
      const search = filter.search.trim();
      const orClauses: Prisma.PurchaseOrderWhereInput[] = [
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ];
      const numericMatch = search.match(/(\d+)/);
      if (numericMatch) {
        const parsed = Number.parseInt(numericMatch[1], 10);
        if (!Number.isNaN(parsed)) {
          orClauses.push({ number: parsed });
        }
      }
      where.OR = orClauses;
    }

    const [items, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: [{ orderDate: 'desc' }, { number: 'desc' }],
        include: DEFAULT_INCLUDE,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    const itemsWithInvoiceAvailability =
      await this.addReceiptInvoiceAvailability(items);

    return toPaginatedResult(itemsWithInvoiceAvailability, total, pagination);
  }

  async getById(id: string): Promise<PurchaseOrder> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: DEFAULT_INCLUDE,
    });
    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    const [orderWithInvoiceAvailability] =
      await this.addReceiptInvoiceAvailability([order]);
    return orderWithInvoiceAvailability;
  }

  private async addReceiptInvoiceAvailability(
    orders: PurchaseOrderWithDefaultInclude[],
  ) {
    const receiptLineIds = orders.flatMap((order) =>
      order.receipts.flatMap((receipt) => receipt.lines.map((line) => line.id)),
    );
    if (receiptLineIds.length === 0) return orders;

    const invoicedLines = await this.prisma.invoiceItem.findMany({
      where: {
        sourceType: InvoiceItemSourceType.PURCHASE_RECEIPT_LINE,
        sourceId: { in: receiptLineIds },
        invoice: { status: { not: InvoiceStatus.CANCELLED } },
      },
      select: { sourceId: true, quantity: true },
    });
    const invoicedQtyByReceiptLine = new Map<string, number>();

    for (const line of invoicedLines) {
      if (!line.sourceId) continue;
      invoicedQtyByReceiptLine.set(
        line.sourceId,
        (invoicedQtyByReceiptLine.get(line.sourceId) ?? 0) + line.quantity,
      );
    }

    return orders.map((order) => ({
      ...order,
      receipts: order.receipts.map((receipt) => ({
        ...receipt,
        lines: receipt.lines.map((line) => {
          const invoicedQty = invoicedQtyByReceiptLine.get(line.id) ?? 0;
          return {
            ...line,
            invoicedQty,
            remainingInvoiceQty: Math.max(0, line.qtyReceived - invoicedQty),
          };
        }),
      })),
    }));
  }

  async create(
    input: CreatePurchaseOrderInput,
    createdById: string,
  ): Promise<PurchaseOrder> {
    if (!input.lines || input.lines.length === 0) {
      throw new BadRequestException(
        'Purchase order must have at least one line',
      );
    }
    this.validateLines(input.lines);

    const [supplier, warehouse] = await Promise.all([
      this.prisma.partner.findUnique({ where: { id: input.supplierId } }),
      this.prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
    ]);
    if (!supplier) {
      throw new NotFoundException(`Supplier ${input.supplierId} not found`);
    }
    if (
      supplier.partnerType !== PartnerType.SUPPLIER &&
      supplier.partnerType !== PartnerType.BOTH
    ) {
      throw new BadRequestException(
        `Partner ${supplier.name} is not a supplier`,
      );
    }
    if (!supplier.isActive) {
      throw new BadRequestException(`Supplier ${supplier.name} is inactive`);
    }
    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${input.warehouseId} not found`);
    }
    if (!warehouse.isActive) {
      throw new BadRequestException(`Warehouse ${warehouse.code} is inactive`);
    }

    const productIds = Array.from(new Set(input.lines.map((l) => l.productId)));
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = productIds.filter((id) => !found.has(id));
      throw new NotFoundException(`Products not found: ${missing.join(', ')}`);
    }

    const subtotal = input.lines.reduce(
      (sum, l) => sum + l.qtyOrdered * l.unitCost,
      0,
    );

    const created = await this.prisma.purchaseOrder.create({
      data: {
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
        expectedDate: input.expectedDate ?? null,
        currency: 'EUR',
        notes: input.notes ?? null,
        subtotal,
        createdById,
        lines: {
          create: input.lines.map((l) => ({
            productId: l.productId,
            qtyOrdered: l.qtyOrdered,
            unitCost: l.unitCost,
            notes: l.notes ?? null,
          })),
        },
      },
      include: DEFAULT_INCLUDE,
    });
    return created;
  }

  async update(input: UpdatePurchaseOrderInput): Promise<PurchaseOrder> {
    const existing = await this.prisma.purchaseOrder.findUnique({
      where: { id: input.id },
      include: { receipts: { select: { id: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Purchase order ${input.id} not found`);
    }
    if (existing.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT purchase orders can be edited');
    }
    if (existing.receipts.length > 0) {
      throw new ConflictException(
        'Cannot edit a purchase order that has receipts',
      );
    }

    let newSubtotal: number | undefined;
    if (input.lines) {
      this.validateLines(input.lines);
      const productIds = Array.from(
        new Set(input.lines.map((l) => l.productId)),
      );
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      if (products.length !== productIds.length) {
        throw new NotFoundException('One or more line products do not exist');
      }
      newSubtotal = input.lines.reduce(
        (sum, l) => sum + l.qtyOrdered * l.unitCost,
        0,
      );
    }

    if (input.supplierId) {
      const supplier = await this.prisma.partner.findUnique({
        where: { id: input.supplierId },
      });
      if (!supplier) {
        throw new NotFoundException(`Supplier ${input.supplierId} not found`);
      }
      if (
        supplier.partnerType !== PartnerType.SUPPLIER &&
        supplier.partnerType !== PartnerType.BOTH
      ) {
        throw new BadRequestException(
          `Partner ${supplier.name} is not a supplier`,
        );
      }
      if (!supplier.isActive) {
        throw new BadRequestException(`Supplier ${supplier.name} is inactive`);
      }
    }
    if (input.warehouseId) {
      const warehouse = await this.prisma.warehouse.findUnique({
        where: { id: input.warehouseId },
      });
      if (!warehouse) {
        throw new NotFoundException(`Warehouse ${input.warehouseId} not found`);
      }
      if (!warehouse.isActive) {
        throw new BadRequestException(
          `Warehouse ${warehouse.code} is inactive`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (input.lines) {
        await tx.purchaseOrderLine.deleteMany({
          where: { orderId: input.id },
        });
        await tx.purchaseOrderLine.createMany({
          data: input.lines.map((l) => ({
            orderId: input.id,
            productId: l.productId,
            qtyOrdered: l.qtyOrdered,
            unitCost: l.unitCost,
            notes: l.notes ?? null,
          })),
        });
      }

      const updated = await tx.purchaseOrder.update({
        where: { id: input.id },
        data: {
          supplierId: input.supplierId ?? undefined,
          warehouseId: input.warehouseId ?? undefined,
          expectedDate:
            input.expectedDate === undefined ? undefined : input.expectedDate,
          currency: input.currency === undefined ? undefined : 'EUR',
          notes: input.notes === undefined ? undefined : input.notes,
          subtotal: newSubtotal ?? undefined,
        },
        include: DEFAULT_INCLUDE,
      });
      return updated;
    });
  }

  async confirm(id: string): Promise<PurchaseOrder> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT purchase orders can be confirmed',
      );
    }
    if (order.lines.length === 0) {
      throw new BadRequestException(
        'Cannot confirm a purchase order with no lines',
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.ORDERED },
      include: DEFAULT_INCLUDE,
    });
  }

  async cancel(id: string, reason?: string): Promise<PurchaseOrder> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });
    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    if (
      order.status === PurchaseOrderStatus.FULLY_RECEIVED ||
      order.status === PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel a ${order.status.toLowerCase()} purchase order`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelReason: reason ?? null,
      },
      include: DEFAULT_INCLUDE,
    });
  }

  async delete(id: string): Promise<boolean> {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { receipts: { select: { id: true } } },
    });
    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(
        'Only DRAFT purchase orders can be deleted',
      );
    }
    if (order.receipts.length > 0) {
      throw new ConflictException(
        'Cannot delete a purchase order that has receipts',
      );
    }
    await this.prisma.purchaseOrder.delete({ where: { id } });
    return true;
  }

  async recordReceipt(
    input: RecordReceiptInput,
    createdById: string,
  ): Promise<PurchaseOrderReceipt> {
    return this.receiving.recordReceipt(input, createdById);
  }

  // ----- In-transit aggregations ---------------------------------------------

  async inTransitForProduct(
    productId: string,
    warehouseId?: string,
  ): Promise<number> {
    const lines = await this.prisma.purchaseOrderLine.findMany({
      where: {
        productId,
        order: {
          status: { in: OPEN_STATUSES },
          ...(warehouseId ? { warehouseId } : {}),
        },
      },
      select: { qtyOrdered: true, qtyReceived: true },
    });
    return lines.reduce(
      (sum, l) => sum + Math.max(0, l.qtyOrdered - l.qtyReceived),
      0,
    );
  }

  async inTransitForProductStock(
    productId: string,
    warehouseId: string,
  ): Promise<number> {
    return this.inTransitForProduct(productId, warehouseId);
  }

  async inTransitByProduct(
    productId: string,
    warehouseId?: string,
  ): Promise<InTransitRow[]> {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        status: { in: OPEN_STATUSES },
        ...(warehouseId ? { warehouseId } : {}),
        lines: { some: { productId } },
      },
      include: {
        supplier: true,
        lines: { where: { productId } },
      },
    });

    const bySupplier = new Map<string, InTransitRow>();
    for (const order of orders) {
      const outstanding = order.lines.reduce(
        (sum, l) => sum + Math.max(0, l.qtyOrdered - l.qtyReceived),
        0,
      );
      if (outstanding <= 0) continue;

      const existing = bySupplier.get(order.supplierId);
      if (existing) {
        existing.qtyInTransit += outstanding;
        existing.orderIds.push(order.id);
        if (
          order.expectedDate &&
          (!existing.earliestExpectedDate ||
            order.expectedDate < existing.earliestExpectedDate)
        ) {
          existing.earliestExpectedDate = order.expectedDate;
        }
      } else {
        bySupplier.set(order.supplierId, {
          productId,
          warehouseId: warehouseId ?? null,
          supplierId: order.supplierId,
          supplierName: order.supplier.name,
          qtyInTransit: outstanding,
          earliestExpectedDate: order.expectedDate ?? null,
          orderIds: [order.id],
        });
      }
    }
    return Array.from(bySupplier.values()).sort(
      (a, b) => b.qtyInTransit - a.qtyInTransit,
    );
  }

  async inTransitSummary(
    warehouseId?: string,
  ): Promise<InTransitProductSummary[]> {
    const lines = await this.prisma.purchaseOrderLine.findMany({
      where: {
        order: {
          status: { in: OPEN_STATUSES },
          ...(warehouseId ? { warehouseId } : {}),
        },
      },
      include: {
        product: true,
        order: { select: { id: true, expectedDate: true } },
      },
    });

    const map = new Map<
      string,
      {
        product: { id: string; sku: string; name: string };
        qty: number;
        orderIds: Set<string>;
        earliest?: Date | null;
      }
    >();
    for (const line of lines) {
      const outstanding = Math.max(0, line.qtyOrdered - line.qtyReceived);
      if (outstanding <= 0) continue;
      const entry = map.get(line.productId);
      const expected = line.order.expectedDate ?? null;
      if (entry) {
        entry.qty += outstanding;
        entry.orderIds.add(line.order.id);
        if (expected && (!entry.earliest || expected < entry.earliest)) {
          entry.earliest = expected;
        }
      } else {
        map.set(line.productId, {
          product: {
            id: line.product.id,
            sku: line.product.sku,
            name: line.product.name,
          },
          qty: outstanding,
          orderIds: new Set([line.order.id]),
          earliest: expected,
        });
      }
    }

    return Array.from(map.values())
      .map((e) => ({
        productId: e.product.id,
        productSku: e.product.sku,
        productName: e.product.name,
        qtyInTransit: e.qty,
        openOrderCount: e.orderIds.size,
        earliestExpectedDate: e.earliest ?? null,
      }))
      .sort((a, b) => b.qtyInTransit - a.qtyInTransit);
  }

  // ----- helpers -------------------------------------------------------------

  private validateLines(lines: CreatePurchaseOrderLineInput[]) {
    for (const line of lines) {
      if (line.qtyOrdered <= 0) {
        throw new BadRequestException(
          `Each line must have qtyOrdered greater than 0`,
        );
      }
      if (line.unitCost < 0) {
        throw new BadRequestException(`Unit cost cannot be negative`);
      }
    }
  }
}
