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
        quantity: line.qtyReceived,
        unit: product?.unit ?? "buc",
        unitPrice: line.orderLine?.unitCost ?? 0,
        vatRate: 19,
        sourceType: "MANUAL" as const,
        sourceId: line.id,
      };
    }),
  );
}

export function getSelectedPurchaseOrderReceipts(
  purchaseOrder: PurchaseOrder | undefined,
  receiptIds: string[],
) {
  if (!purchaseOrder) return [];
  const selected = new Set(receiptIds);

  return purchaseOrder.receipts.filter((receipt) => selected.has(receipt.id));
}
