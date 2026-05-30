export type HrLeaveSummaryRow = {
  status: string;
  count: number;
};

export type FinanceAgingRow = {
  label: string;
  amount: number;
  invoiceCount: number;
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
