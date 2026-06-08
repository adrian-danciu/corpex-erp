import type { User } from "./auth.types";
import type { Partner } from "./finance.types";
import type { Product, Warehouse } from "./stock.types";

export const PurchaseOrderStatus = {
  DRAFT: "DRAFT",
  ORDERED: "ORDERED",
  PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
  FULLY_RECEIVED: "FULLY_RECEIVED",
  CANCELLED: "CANCELLED",
} as const;

export type PurchaseOrderStatus =
  (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export interface PurchaseOrderLine {
  id: string;
  orderId: string;
  productId: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyOutstanding: number;
  unitCost: number;
  notes?: string | null;
  product?: Pick<Product, "id" | "sku" | "name" | "unit"> | null;
}

export interface PurchaseOrderReceiptLine {
  id: string;
  receiptId: string;
  orderLineId: string;
  qtyReceived: number;
  invoicedQty: number;
  remainingInvoiceQty: number;
  orderLine?: Pick<PurchaseOrderLine, "id" | "productId" | "unitCost"> & {
    product?: Pick<Product, "id" | "sku" | "name" | "unit"> | null;
  };
}

export interface PurchaseOrderReceipt {
  id: string;
  orderId: string;
  nirSeries: string;
  nirNumber: number;
  formattedNumber: string;
  receivedDate: string;
  notes?: string | null;
  createdById: string;
  createdAt: string;
  createdBy?: Pick<User, "id" | "firstName" | "lastName"> | null;
  lines: PurchaseOrderReceiptLine[];
}

export interface PurchaseOrder {
  id: string;
  series: string;
  number: number;
  formattedNumber: string;
  supplierId: string;
  warehouseId: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string | null;
  currency: string;
  subtotal: number;
  notes?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Pick<Partner, "id" | "name" | "cui" | "partnerType" | "isActive"> | null;
  warehouse?: Pick<Warehouse, "id" | "code" | "name"> | null;
  createdBy?: Pick<User, "id" | "firstName" | "lastName"> | null;
  lines: PurchaseOrderLine[];
  receipts: PurchaseOrderReceipt[];
}

export interface InTransitProductSummary {
  productId: string;
  productSku: string;
  productName: string;
  qtyInTransit: number;
  openOrderCount: number;
  earliestExpectedDate?: string | null;
}

export interface InTransitRow {
  productId: string;
  warehouseId?: string | null;
  supplierId: string;
  supplierName: string;
  qtyInTransit: number;
  earliestExpectedDate?: string | null;
  orderIds: string[];
}

export interface PurchaseOrdersQueryResult {
  purchaseOrders: import("./pagination.types").PaginatedResult<PurchaseOrder>;
}

export interface PurchaseOrderQueryResult {
  purchaseOrder: PurchaseOrder;
}

export interface InTransitSummaryQueryResult {
  inTransitSummary: InTransitProductSummary[];
}

export interface InTransitStockQueryResult {
  inTransitStock: InTransitRow[];
}

export interface CreatePurchaseOrderMutationResult {
  createPurchaseOrder: PurchaseOrder;
}

export interface RecordPurchaseOrderReceiptMutationResult {
  recordPurchaseOrderReceipt: PurchaseOrderReceipt;
}
