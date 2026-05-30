import { gql } from "@apollo/client";

export const HR_LEAVE_SUMMARY_QUERY = gql`
  query HrLeaveSummary {
    hrLeaveSummary {
      status
      count
    }
  }
`;

export const FINANCE_AGING_SUMMARY_QUERY = gql`
  query FinanceAgingSummary {
    financeAgingSummary {
      label
      amount
      invoiceCount
    }
  }
`;

export const EMPLOYEE_REPORT_QUERY = gql`
  query EmployeeReport {
    employeeReport {
      id
      firstName
      lastName
      position
      department
      contractType
      employmentDate
      remainingLeave
      annualLeaveDays
    }
  }
`;

export const STOCK_REPORT_QUERY = gql`
  query StockReport {
    stockReport {
      productId
      productName
      sku
      warehouseName
      quantity
    }
  }
`;

export const FLEET_REPORT_QUERY = gql`
  query FleetReport {
    fleetReport {
      id
      plateNumber
      brand
      model
      year
      status
      nearestDocumentExpiry
      nearestDocumentType
    }
  }
`;
