import { gql } from "@apollo/client";

export const INVOICE_SUMMARY_FRAGMENT = gql`
  fragment InvoiceSummaryFields on Invoice {
    id
    series
    number
    invoiceType
    status
    partnerId
    partner {
      id
      name
      cui
    }
    isClientInvoice
    issueDate
    dueDate
    subtotal
    vatTotal
    total
    paidAmount
    currency
    projectId
    purchaseOrderId
    purchaseReceiptId
    createdAt
  }
`;
