import { gql } from "@apollo/client";

const PAYROLL_PERIOD_FIELDS = gql`
  fragment PayrollPeriodFields on PayrollPeriod {
    id
    year
    month
    status
    currency
    notes
    createdById
    approvedById
    approvedAt
    paidById
    paidAt
    totalGross
    totalBonus
    totalCas
    totalCass
    totalIncomeTax
    totalManualDeductions
    totalNet
    totalEmployerCost
    employeeCount
    createdAt
    updatedAt
    createdBy {
      id
      firstName
      lastName
      email
    }
    approvedBy {
      id
      firstName
      lastName
      email
    }
    paidBy {
      id
      firstName
      lastName
      email
    }
  }
`;

const PAYROLL_LINE_FIELDS = gql`
  fragment PayrollLineFields on PayrollLine {
    id
    periodId
    employeeId
    grossSalary
    bonus
    manualDeductions
    unpaidLeaveDays
    unpaidLeaveDeduction
    taxableGross
    casRate
    casAmount
    cassRate
    cassAmount
    incomeTaxRate
    incomeTaxAmount
    camRate
    camAmount
    employerTotalCost
    taxRuleVersion
    netAmount
    notes
    createdAt
    updatedAt
    employee {
      id
      firstName
      lastName
      position
      department
      isContractor
    }
  }
`;

export const GET_PAYROLL_PERIODS_QUERY = gql`
  ${PAYROLL_PERIOD_FIELDS}
  query PayrollPeriods {
    payrollPeriods {
      ...PayrollPeriodFields
    }
  }
`;

export const GET_PAYROLL_PERIOD_QUERY = gql`
  ${PAYROLL_PERIOD_FIELDS}
  ${PAYROLL_LINE_FIELDS}
  query PayrollPeriod($id: ID!) {
    payrollPeriod(id: $id) {
      ...PayrollPeriodFields
      lines {
        ...PayrollLineFields
      }
    }
  }
`;

export const GENERATE_PAYROLL_MUTATION = gql`
  ${PAYROLL_PERIOD_FIELDS}
  ${PAYROLL_LINE_FIELDS}
  mutation GeneratePayroll($input: GeneratePayrollInput!) {
    generatePayroll(input: $input) {
      ...PayrollPeriodFields
      lines {
        ...PayrollLineFields
      }
    }
  }
`;

export const UPDATE_PAYROLL_LINE_MUTATION = gql`
  ${PAYROLL_LINE_FIELDS}
  mutation UpdatePayrollLine($input: UpdatePayrollLineInput!) {
    updatePayrollLine(input: $input) {
      ...PayrollLineFields
    }
  }
`;

export const APPROVE_PAYROLL_MUTATION = gql`
  ${PAYROLL_PERIOD_FIELDS}
  ${PAYROLL_LINE_FIELDS}
  mutation ApprovePayroll($periodId: ID!) {
    approvePayroll(periodId: $periodId) {
      ...PayrollPeriodFields
      lines {
        ...PayrollLineFields
      }
    }
  }
`;

export const MARK_PAYROLL_PAID_MUTATION = gql`
  ${PAYROLL_PERIOD_FIELDS}
  ${PAYROLL_LINE_FIELDS}
  mutation MarkPayrollPaid($periodId: ID!) {
    markPayrollPaid(periodId: $periodId) {
      ...PayrollPeriodFields
      lines {
        ...PayrollLineFields
      }
    }
  }
`;

export const DELETE_PAYROLL_PERIOD_MUTATION = gql`
  ${PAYROLL_PERIOD_FIELDS}
  mutation DeletePayrollPeriod($periodId: ID!) {
    deletePayrollPeriod(periodId: $periodId) {
      ...PayrollPeriodFields
    }
  }
`;
