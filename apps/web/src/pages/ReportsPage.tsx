import { useQuery } from "@apollo/client/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { FinanceAgingReportCard } from "./reports/components/FinanceAgingReportCard";
import {
  ReportExportButtons,
  type ReportExportDefinition,
} from "./reports/components/ReportExportButtons";
import { ReportTableCard } from "./reports/components/ReportTableCard";
import {
  EMPLOYEE_REPORT_QUERY,
  FINANCE_AGING_SUMMARY_QUERY,
  FLEET_REPORT_QUERY,
  HR_LEAVE_SUMMARY_QUERY,
  STOCK_REPORT_QUERY,
  SUPPLIER_AGING_SUMMARY_QUERY,
} from "@/graphql/queries/report.queries";
import type {
  EmployeeReportQueryResult,
  FinanceAgingQueryResult,
  FleetReportQueryResult,
  HrLeaveSummaryQueryResult,
  StockReportQueryResult,
  SupplierAgingQueryResult,
} from "@/types/report.types";
import { formatDate } from "@/lib/formatters";

export default function ReportsPage() {
  const [leaveFilter, setLeaveFilter] = useState<string>("ALL");
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: hrData, loading: hrLoading, error: hrError } =
    useQuery<HrLeaveSummaryQueryResult>(HR_LEAVE_SUMMARY_QUERY);

  const { data: financeData, loading: financeLoading, error: financeError } =
    useQuery<FinanceAgingQueryResult>(FINANCE_AGING_SUMMARY_QUERY);

  const {
    data: supplierFinanceData,
    loading: supplierFinanceLoading,
    error: supplierFinanceError,
  } = useQuery<SupplierAgingQueryResult>(SUPPLIER_AGING_SUMMARY_QUERY);

  const { data: employeeData, loading: employeeLoading, error: employeeError } =
    useQuery<EmployeeReportQueryResult>(EMPLOYEE_REPORT_QUERY);

  const { data: stockData, loading: stockLoading, error: stockError } =
    useQuery<StockReportQueryResult>(STOCK_REPORT_QUERY);

  const { data: fleetData, loading: fleetLoading, error: fleetError } =
    useQuery<FleetReportQueryResult>(FLEET_REPORT_QUERY);

  const leaveRows = hrData?.hrLeaveSummary ?? [];
  const agingRows = financeData?.financeAgingSummary ?? [];
  const supplierAgingRows = supplierFinanceData?.supplierAgingSummary ?? [];
  const employeeRows = employeeData?.employeeReport ?? [];
  const stockRows = stockData?.stockReport ?? [];
  const fleetRows = fleetData?.fleetReport ?? [];

  const filteredLeaveRows =
    leaveFilter === "ALL" ? leaveRows : leaveRows.filter((r) => r.status === leaveFilter);

  const shortId = (id: string) =>
    id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;

  const employeeExport = {
    title: "HR Employee Report",
    filename: "employee-report",
    columns: [
      { header: "ID", width: 110 },
      { header: "First Name", width: 80 },
      { header: "Last Name", width: 80 },
      { header: "Position", width: 110 },
      { header: "Department", width: 80 },
      { header: "Contract Type", width: 90 },
      { header: "Employment Date", width: 85 },
      { header: "Remaining Leave", width: 85 },
      { header: "Annual Leave", width: 75 },
    ],
    rows: employeeRows.map((r) => [
      shortId(r.id),
      r.firstName,
      r.lastName,
      r.position,
      r.department,
      r.contractType,
      formatDate(r.employmentDate),
      String(r.remainingLeave),
      String(r.annualLeaveDays),
    ]),
  };

  const stockExport = {
    title: "Stock Inventory Report",
    filename: "stock-report",
    columns: [
      { header: "Product ID", width: 125 },
      { header: "Product Name", width: 170 },
      { header: "SKU", width: 90 },
      { header: "Warehouse", width: 150 },
      { header: "Quantity", width: 70 },
    ],
    rows: stockRows.map((r) => [
      r.productId,
      r.productName,
      r.sku,
      r.warehouseName,
      String(r.quantity),
    ]),
  };

  const fleetExport = {
    title: "Fleet Vehicle Status Report",
    filename: "fleet-report",
    columns: [
      { header: "ID", width: 120 },
      { header: "Plate Number", width: 75 },
      { header: "Brand", width: 80 },
      { header: "Model", width: 90 },
      { header: "Year", width: 45 },
      { header: "Status", width: 75 },
      { header: "Nearest Doc Expiry", width: 95 },
      { header: "Nearest Doc Type", width: 95 },
    ],
    rows: fleetRows.map((r) => [
      r.id,
      r.plateNumber,
      r.brand,
      r.model,
      String(r.year),
      r.status,
      r.nearestDocumentExpiry ? formatDate(r.nearestDocumentExpiry) : "",
      r.nearestDocumentType ?? "",
    ]),
  };

  const runExport = async (
    format: "pdf" | "xlsx",
    report: ReportExportDefinition,
  ) => {
    const key = `${report.filename}-${format}`;
    setExporting(key);
    try {
      const { exportReport } = await import("@/lib/report-export");
      await exportReport(format, report.filename, report.title, report.columns, report.rows);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-slate-500 mt-2">
          HR, Finance, Stock, and Fleet reports based on current ERP data.
        </p>
      </div>

      <ReportTableCard
        title="HR – Leave Requests by Status"
        description="Overview of leave requests grouped by current status."
        rows={filteredLeaveRows}
        loading={hrLoading}
        error={Boolean(hrError)}
        errorLabel="Failed to load HR leave summary."
        emptyLabel="No leave requests found."
        getRowKey={(row) => row.status}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter status</span>
            <Select value={leaveFilter} onValueChange={setLeaveFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        columns={[
          {
            header: "Status",
            className: "font-medium",
            render: (row) =>
              row.status.charAt(0) + row.status.slice(1).toLowerCase(),
          },
          {
            header: "Count",
            className: "text-right",
            render: (row) => row.count,
          },
        ]}
      />

      <FinanceAgingReportCard
        title="Finance – Client Receivables Aging"
        description="Outstanding client invoice amounts grouped by days past due."
        rows={agingRows}
        loading={financeLoading}
        error={Boolean(financeError)}
        errorLabel="Failed to load client receivables aging."
        emptyLabel="No outstanding client invoices found."
      />

      <FinanceAgingReportCard
        title="Finance – Supplier Payables Aging"
        description="Outstanding supplier invoice amounts grouped by days past due."
        rows={supplierAgingRows}
        loading={supplierFinanceLoading}
        error={Boolean(supplierFinanceError)}
        errorLabel="Failed to load supplier payables aging."
        emptyLabel="No outstanding supplier invoices found."
      />

      <ReportTableCard
        title="HR – Employee Report"
        description="Full list of employees with contract and status information."
        rows={employeeRows}
        loading={employeeLoading}
        error={Boolean(employeeError)}
        errorLabel="Failed to load employee report."
        emptyLabel="No employees found."
        getRowKey={(row) => row.id}
        actions={
          <ReportExportButtons
            report={employeeExport}
            disabled={employeeRows.length === 0}
            exporting={exporting}
            runExport={runExport}
          />
        }
        columns={[
          {
            header: "Name",
            className: "font-medium",
            render: (row) => `${row.firstName} ${row.lastName}`,
          },
          { header: "Position", render: (row) => row.position },
          { header: "Department", render: (row) => row.department },
          {
            header: "Contract",
            render: (row) => row.contractType.replace("_", " "),
          },
          {
            header: "Employment Date",
            render: (row) => formatDate(row.employmentDate),
          },
          {
            header: "Leave Remaining",
            className: "text-right",
            render: (row) =>
              `${row.remainingLeave} / ${row.annualLeaveDays}`,
          },
        ]}
      />

      <ReportTableCard
        title="Stock – Current Inventory"
        description="Net stock per product per warehouse based on all movements."
        rows={stockRows}
        loading={stockLoading}
        error={Boolean(stockError)}
        errorLabel="Failed to load stock report."
        emptyLabel="No stock data found."
        getRowKey={(row) => `${row.productId}-${row.warehouseName}`}
        actions={
          <ReportExportButtons
            report={stockExport}
            disabled={stockRows.length === 0}
            exporting={exporting}
            runExport={runExport}
          />
        }
        columns={[
          {
            header: "Product",
            className: "font-medium",
            render: (row) => row.productName,
          },
          {
            header: "SKU",
            className: "text-muted-foreground",
            render: (row) => row.sku,
          },
          { header: "Warehouse", render: (row) => row.warehouseName },
          {
            header: "Qty",
            className: "text-right font-medium",
            render: (row) => row.quantity,
          },
        ]}
      />

      <ReportTableCard
        title="Fleet – Vehicle Status Report"
        description="All vehicles with status and nearest document expiry."
        rows={fleetRows}
        loading={fleetLoading}
        error={Boolean(fleetError)}
        errorLabel="Failed to load fleet report."
        emptyLabel="No vehicles found."
        getRowKey={(row) => row.id}
        actions={
          <ReportExportButtons
            report={fleetExport}
            disabled={fleetRows.length === 0}
            exporting={exporting}
            runExport={runExport}
          />
        }
        columns={[
          {
            header: "Plate",
            className: "font-medium",
            render: (row) => row.plateNumber,
          },
          {
            header: "Vehicle",
            render: (row) => `${row.brand} ${row.model}`,
          },
          { header: "Year", render: (row) => row.year },
          { header: "Status", render: (row) => row.status },
          {
            header: "Nearest Doc Expiry",
            render: (row) => formatDate(row.nearestDocumentExpiry),
          },
          {
            header: "Doc Type",
            render: (row) => row.nearestDocumentType ?? "—",
          },
        ]}
      />
    </div>
  );
}
