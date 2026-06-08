import { gql } from "@apollo/client";
import { INVOICE_SUMMARY_FRAGMENT } from "@/graphql/fragments/finance.fragments";

export const FINANCE_OVERVIEW_QUERY = gql`
  query FinanceOverview {
    financeOverview {
      totalReceivable
      totalPayable
      overdueAmount
      invoicesThisMonth
    }
  }
`;

export const RECENT_FINANCE_INVOICES_QUERY = gql`
  query RecentFinanceInvoices($pagination: PaginationInput, $isClientInvoice: Boolean) {
    invoices(pagination: $pagination, isClientInvoice: $isClientInvoice) {
      items {
        ...InvoiceSummaryFields
      }
      meta {
        total
        skip
        take
      }
    }
  }
  ${INVOICE_SUMMARY_FRAGMENT}
`;
