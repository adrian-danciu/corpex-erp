import { describe, expect, it } from "bun:test";
import {
  buildSupplierInvoiceItemsFromReceipts,
  getAvailableSupplierPurchaseOrders,
} from "../src/lib/supplier-invoice-lines";
import type { PurchaseOrder } from "../src/types/purchaseOrder.types";

const purchaseOrder = {
  id: "po-1",
  supplierId: "supplier-1",
  receipts: [
    {
      id: "receipt-1",
      formattedNumber: "NIR-1",
      lines: [
        {
          id: "line-1",
          qtyReceived: 5,
          invoicedQty: 3,
          remainingInvoiceQty: 2,
          orderLine: {
            id: "order-line-1",
            productId: "product-1",
            unitCost: 10,
            product: { id: "product-1", sku: "P1", name: "Cable", unit: "m" },
          },
        },
      ],
    },
    {
      id: "receipt-2",
      formattedNumber: "NIR-2",
      lines: [
        {
          id: "line-2",
          qtyReceived: 1,
          invoicedQty: 1,
          remainingInvoiceQty: 0,
        },
      ],
    },
  ],
} as PurchaseOrder;

describe("supplier invoice line availability", () => {
  it("hides fully invoiced NIRs and keeps purchase orders with remaining lines", () => {
    expect(getAvailableSupplierPurchaseOrders([purchaseOrder], "supplier-1"))
      .toEqual([
        expect.objectContaining({
          id: "po-1",
          receipts: [expect.objectContaining({ id: "receipt-1" })],
        }),
      ]);
  });

  it("imports only the remaining uninvoiced receipt quantity", () => {
    expect(
      buildSupplierInvoiceItemsFromReceipts([purchaseOrder.receipts[0]]),
    ).toEqual([
      expect.objectContaining({
        sourceId: "line-1",
        quantity: 2,
      }),
    ]);
  });
});
