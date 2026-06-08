import { gql } from "@apollo/client";

export const DASHBOARD_METRICS_QUERY = gql`
  query DashboardMetrics {
    dashboardMetrics {
      totalUsers
      totalEmployees
      pendingLeaveRequests
      approvedLeaveThisMonth
      totalInvoices
      overdueInvoices
      totalInvoicedAmount
      totalPaidAmount
      totalSupplierInvoices
      overdueSupplierInvoices
      totalPayableAmount
      totalSupplierPaidAmount
    }
  }
`;

export const HR_LEAVE_SUMMARY_DASHBOARD_QUERY = gql`
  query HrLeaveSummaryDash {
    hrLeaveSummary {
      status
      count
    }
  }
`;

export const FINANCE_AGING_DASHBOARD_QUERY = gql`
  query FinanceAgingSummaryDash {
    financeAgingSummary {
      label
      amount
      invoiceCount
    }
  }
`;

export const SUPPLIER_AGING_DASHBOARD_QUERY = gql`
  query SupplierAgingSummaryDash {
    supplierAgingSummary {
      label
      amount
      invoiceCount
    }
  }
`;
