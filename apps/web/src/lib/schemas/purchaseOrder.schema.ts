import { z } from "zod";

export const purchaseOrderLineSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  qtyOrdered: z.coerce.number().min(0.0001, "Quantity must be greater than 0"),
  unitCost: z.coerce.number().min(0, "Unit cost cannot be negative"),
  notes: z
    .string()
    .max(500, "Notes are too long")
    .optional()
    .or(z.literal("")),
});

export type PurchaseOrderLineFormData = z.infer<typeof purchaseOrderLineSchema>;

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  warehouseId: z.string().min(1, "Warehouse is required"),
  expectedDate: z.string().optional().or(z.literal("")),
  currency: z.string().default("RON"),
  notes: z
    .string()
    .max(1000, "Notes are too long")
    .optional()
    .or(z.literal("")),
  lines: z
    .array(purchaseOrderLineSchema)
    .min(1, "At least one line item is required"),
});

export type CreatePurchaseOrderFormData = z.infer<
  typeof createPurchaseOrderSchema
>;

export const receiptLineSchema = z.object({
  orderLineId: z.string().min(1),
  qtyReceived: z.coerce.number().min(0, "Quantity cannot be negative"),
});

export type ReceiptLineFormData = z.infer<typeof receiptLineSchema>;

export const recordReceiptSchema = z.object({
  orderId: z.string().min(1),
  receivedDate: z.string().optional().or(z.literal("")),
  notes: z
    .string()
    .max(500, "Notes are too long")
    .optional()
    .or(z.literal("")),
  lines: z
    .array(receiptLineSchema)
    .min(1)
    .refine(
      (lines) => lines.some((l) => l.qtyReceived > 0),
      "At least one line must have qty > 0",
    ),
});

export type RecordReceiptFormData = z.infer<typeof recordReceiptSchema>;
