export type HrLeaveSummaryRow = {
  status: string;
  count: number;
};

export type FinanceAgingRow = {
  label: string;
  amount: number;
  invoiceCount: number;
};

export type DashboardMetrics = {
  totalUsers: number;
  totalEmployees: number;
  pendingLeaveRequests: number;
  approvedLeaveThisMonth: number;
  totalInvoices: number;
  overdueInvoices: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  totalSupplierInvoices: number;
  overdueSupplierInvoices: number;
  totalPayableAmount: number;
  totalSupplierPaidAmount: number;
};

export type DashboardMetricsQueryResult = {
  dashboardMetrics: DashboardMetrics;
};

export type HrLeaveSummaryQueryResult = {
  hrLeaveSummary: HrLeaveSummaryRow[];
};

export type FinanceAgingQueryResult = {
  financeAgingSummary: FinanceAgingRow[];
};

export type SupplierAgingQueryResult = {
  supplierAgingSummary: FinanceAgingRow[];
};

export type EmployeeReportRow = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  contractType: string;
  employmentDate: string;
  remainingLeave: number;
  annualLeaveDays: number;
};

export type StockReportRow = {
  productId: string;
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
};

export type FleetReportRow = {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  nearestDocumentExpiry: string | null;
  nearestDocumentType: string | null;
};

export type EmployeeReportQueryResult = {
  employeeReport: EmployeeReportRow[];
};

export type StockReportQueryResult = {
  stockReport: StockReportRow[];
};

export type FleetReportQueryResult = {
  fleetReport: FleetReportRow[];
};
