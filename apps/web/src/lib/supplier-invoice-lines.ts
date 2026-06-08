import type { CreateInvoiceFormData } from "@/lib/schemas/invoice.schema";
import type {
  PurchaseOrder,
  PurchaseOrderReceipt,
} from "@/types/purchaseOrder.types";

export function buildSupplierInvoiceItemsFromReceipts(
  receipts: PurchaseOrderReceipt[],
): CreateInvoiceFormData["items"] {
  return receipts.flatMap((receipt) =>
    receipt.lines.map((line) => {
      const product = line.orderLine?.product;
      const sku = product?.sku ? `${product.sku} - ` : "";

      return {
        description: `${sku}${product?.name ?? "Received item"} (${receipt.formattedNumber})`,
        quantity: line.remainingInvoiceQty ?? line.qtyReceived,
        unit: product?.unit ?? "buc",
        unitPrice: line.orderLine?.unitCost ?? 0,
        vatRate: 19,
        sourceType: "PURCHASE_RECEIPT_LINE" as const,
        sourceId: line.id,
      };
    }),
  );
}

export function getAvailableSupplierPurchaseOrders(
  purchaseOrders: PurchaseOrder[],
  supplierId: string,
): PurchaseOrder[] {
  if (!supplierId) return [];

  return purchaseOrders
    .filter((purchaseOrder) => purchaseOrder.supplierId === supplierId)
    .map((purchaseOrder) => ({
      ...purchaseOrder,
      receipts: purchaseOrder.receipts
        .map((receipt) => ({
          ...receipt,
          lines: receipt.lines.filter(
            (line) => (line.remainingInvoiceQty ?? line.qtyReceived) > 0,
          ),
        }))
        .filter((receipt) => receipt.lines.length > 0),
    }))
    .filter((purchaseOrder) => purchaseOrder.receipts.length > 0);
}

export function getSelectedPurchaseOrderReceipts(
  purchaseOrder: PurchaseOrder | undefined,
  receiptIds: string[],
) {
  if (!purchaseOrder) return [];
  const selected = new Set(receiptIds);

  return purchaseOrder.receipts.filter((receipt) => selected.has(receipt.id));
}
