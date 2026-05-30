import { PartnerType } from "@/types/finance.types";

export type InvoiceDirection = "client" | "supplier";

type InvoiceDirectionConfig = {
  direction: InvoiceDirection;
  isClientInvoice: boolean;
  listPath: string;
  createPath: string;
  listTitle: string;
  listDescription: string;
  createTitle: string;
  createDescription: string;
  createButtonLabel: string;
  submitLabel: string;
  emptyListText: string;
  directionLabel: string;
  partnerLabel: string;
  totalLabel: string;
  paidLabel: string;
  outstandingLabel: string;
  paymentActionLabel: string;
  paymentDialogTitle: string;
  paymentEmptyText: string;
};

export const invoiceDirectionConfig: Record<
  InvoiceDirection,
  InvoiceDirectionConfig
> = {
  client: {
    direction: "client",
    isClientInvoice: true,
    listPath: "/finance/client-invoices",
    createPath: "/finance/client-invoices/new",
    listTitle: "Client Invoices",
    listDescription: "Create and track invoices issued to clients",
    createTitle: "New Client Invoice",
    createDescription: "Create a fiscal or proforma invoice for a client",
    createButtonLabel: "New Client Invoice",
    submitLabel: "Create Client Invoice",
    emptyListText: "Get started by creating your first client invoice",
    directionLabel: "Client invoice",
    partnerLabel: "Client",
    totalLabel: "Total Invoiced",
    paidLabel: "Total Collected",
    outstandingLabel: "Outstanding",
    paymentActionLabel: "Record Collection",
    paymentDialogTitle: "Record Collection",
    paymentEmptyText: "Record a collection to track progress.",
  },
  supplier: {
    direction: "supplier",
    isClientInvoice: false,
    listPath: "/finance/supplier-invoices",
    createPath: "/finance/supplier-invoices/new",
    listTitle: "Supplier Invoices",
    listDescription: "Register and track invoices received from suppliers",
    createTitle: "Add Supplier Invoice",
    createDescription:
      "Register a fiscal or proforma invoice received from a supplier",
    createButtonLabel: "Add Supplier Invoice",
    submitLabel: "Add Supplier Invoice",
    emptyListText: "Get started by registering your first supplier invoice",
    directionLabel: "Supplier invoice",
    partnerLabel: "Supplier",
    totalLabel: "Supplier Bills",
    paidLabel: "Total Paid",
    outstandingLabel: "Still Owed",
    paymentActionLabel: "Record Payment",
    paymentDialogTitle: "Record Supplier Payment",
    paymentEmptyText: "Record a supplier payment to track progress.",
  },
};

export function getInvoiceDirectionConfig(direction: InvoiceDirection) {
  return invoiceDirectionConfig[direction];
}

export function getInvoiceListPath(isClientInvoice: boolean) {
  return isClientInvoice
    ? invoiceDirectionConfig.client.listPath
    : invoiceDirectionConfig.supplier.listPath;
}

export function partnerMatchesInvoiceDirection(
  partnerType: PartnerType,
  direction: InvoiceDirection,
) {
  if (partnerType === PartnerType.BOTH) return true;
  return direction === "client"
    ? partnerType === PartnerType.CLIENT
    : partnerType === PartnerType.SUPPLIER;
}
