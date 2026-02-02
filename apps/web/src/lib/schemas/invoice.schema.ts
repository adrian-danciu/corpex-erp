import { z } from "zod";

export const InvoiceTypeEnum = {
  FISCAL: "FISCAL",
  PROFORMA: "PROFORMA",
} as const;

export const PaymentMethodEnum = {
  BANK_TRANSFER: "BANK_TRANSFER",
  CASH: "CASH",
  CARD: "CARD",
  OTHER: "OTHER",
} as const;

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required").default("buc"),
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or greater"),
  vatRate: z.coerce.number().min(0).max(100).default(19),
});

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

export const createInvoiceSchema = z.object({
  series: z.string().min(1, "Series is required").default("CORP"),

  invoiceType: z.enum([InvoiceTypeEnum.FISCAL, InvoiceTypeEnum.PROFORMA], {
    message: "Invoice type is required",
  }),

  partnerId: z.string().min(1, "Partner is required"),

  isClientInvoice: z.boolean().default(true),

  issueDate: z.string().min(1, "Issue date is required"),

  dueDate: z.string().min(1, "Due date is required"),

  deliveryDate: z.string().optional().or(z.literal("")),

  currency: z.string().default("RON"),

  notes: z.string().max(1000, "Notes are too long").optional().or(z.literal("")),

  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice is required"),

  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),

  paymentDate: z.string().min(1, "Payment date is required"),

  paymentMethod: z.enum(
    [PaymentMethodEnum.BANK_TRANSFER, PaymentMethodEnum.CASH, PaymentMethodEnum.CARD, PaymentMethodEnum.OTHER],
    { message: "Payment method is required" }
  ),

  reference: z.string().max(100, "Reference is too long").optional().or(z.literal("")),

  notes: z.string().max(500, "Notes are too long").optional().or(z.literal("")),
});

export type CreatePaymentFormData = z.infer<typeof createPaymentSchema>;
