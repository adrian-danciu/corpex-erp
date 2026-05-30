import { useQuery } from "@apollo/client/react";
import { AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { ReportDataTable } from "./reports/components/ReportDataTable";
import {
  ReportExportButtons,
  type ReportExportDefinition,
} from "./reports/components/ReportExportButtons";
import {
  EMPLOYEE_REPORT_QUERY,
  FINANCE_AGING_SUMMARY_QUERY,
  FLEET_REPORT_QUERY,
  HR_LEAVE_SUMMARY_QUERY,
  STOCK_REPORT_QUERY,
} from "@/graphql/queries/report.queries";
import type {
  EmployeeReportRow,
  FinanceAgingRow,
  FleetReportRow,
  HrLeaveSummaryRow,
  StockReportRow,
} from "@/types/report.types";

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

export default function ReportsPage() {
  const [leaveFilter, setLeaveFilter] = useState<string>("ALL");
  const [exporting, setExporting] = useState<string | null>(null);

  const { data: hrData, loading: hrLoading, error: hrError } =
    useQuery<{ hrLeaveSummary: HrLeaveSummaryRow[] }>(HR_LEAVE_SUMMARY_QUERY);

  const { data: financeData, loading: financeLoading, error: financeError } =
    useQuery<{ financeAgingSummary: FinanceAgingRow[] }>(FINANCE_AGING_SUMMARY_QUERY);

  const { data: employeeData, loading: employeeLoading, error: employeeError } =
    useQuery<{ employeeReport: EmployeeReportRow[] }>(EMPLOYEE_REPORT_QUERY);

  const { data: stockData, loading: stockLoading, error: stockError } =
    useQuery<{ stockReport: StockReportRow[] }>(STOCK_REPORT_QUERY);

  const { data: fleetData, loading: fleetLoading, error: fleetError } =
    useQuery<{ fleetReport: FleetReportRow[] }>(FLEET_REPORT_QUERY);

  const leaveRows = hrData?.hrLeaveSummary ?? [];
  const agingRows = financeData?.financeAgingSummary ?? [];
  const employeeRows = employeeData?.employeeReport ?? [];
  const stockRows = stockData?.stockReport ?? [];
  const fleetRows = fleetData?.fleetReport ?? [];

  const filteredLeaveRows =
    leaveFilter === "ALL" ? leaveRows : leaveRows.filter((r) => r.status === leaveFilter);

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
      new Date(r.employmentDate).toLocaleDateString("ro-RO"),
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
      r.nearestDocumentExpiry
        ? new Date(r.nearestDocumentExpiry).toLocaleDateString("ro-RO")
        : "",
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

      {/* HR Leave Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>HR – Leave Requests by Status</CardTitle>
            <p className="text-sm text-muted-foreground">
              Overview of leave requests grouped by current status.
            </p>
          </div>
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
        </CardHeader>
        <CardContent>
          {hrLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : hrError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load HR leave summary.</span>
            </div>
          ) : filteredLeaveRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leave requests found.</p>
          ) : (
            <ReportDataTable
              rows={filteredLeaveRows}
              getRowKey={(row) => row.status}
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
          )}
        </CardContent>
      </Card>

      {/* Finance Aging Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Finance – Aging of Outstanding Invoices</CardTitle>
          <p className="text-sm text-muted-foreground">
            Buckets of outstanding amounts by days past due.
          </p>
        </CardHeader>
        <CardContent>
          {financeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : financeError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load finance aging summary.</span>
            </div>
          ) : agingRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No outstanding invoices found.</p>
          ) : (
            <ReportDataTable
              rows={agingRows}
              getRowKey={(row) => row.label}
              columns={[
                {
                  header: "Aging Bucket (days)",
                  className: "font-medium",
                  render: (row) => row.label,
                },
                {
                  header: "Outstanding Amount (EUR)",
                  className: "text-right",
                  render: (row) =>
                    row.amount.toLocaleString("ro-RO", {
                      style: "currency",
                      currency: "EUR",
                    }),
                },
                {
                  header: "Invoice Count",
                  className: "text-right",
                  render: (row) => row.invoiceCount,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Employee Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>HR – Employee Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Full list of employees with contract and status information.
            </p>
          </div>
          <ReportExportButtons
            report={employeeExport}
            disabled={employeeRows.length === 0}
            exporting={exporting}
            runExport={runExport}
          />
        </CardHeader>
        <CardContent>
          {employeeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : employeeError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load employee report.</span>
            </div>
          ) : employeeRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees found.</p>
          ) : (
            <ReportDataTable
              rows={employeeRows}
              getRowKey={(row) => row.id}
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
                  render: (row) =>
                    new Date(row.employmentDate).toLocaleDateString("ro-RO"),
                },
                {
                  header: "Leave Remaining",
                  className: "text-right",
                  render: (row) =>
                    `${row.remainingLeave} / ${row.annualLeaveDays}`,
                },
              ]}
            />
          )}
        </CardContent>
      </Card>

      {/* Stock Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stock – Current Inventory</CardTitle>
            <p className="text-sm text-muted-foreground">
              Net stock per product per warehouse based on all movements.
            </p>
          </div>
          <ReportExportButtons
            report={stockExport}
            disabled={stockRows.length === 0}
            exporting={exporting}
            runExport={runExport}
          />
        </CardHeader>
        <CardContent>
          {stockLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : stockError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load stock report.</span>
            </div>
          ) : stockRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock data found.</p>
          ) : (
            <ReportDataTable
              rows={stockRows}
              getRowKey={(row) => `${row.productId}-${row.warehouseName}`}
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
          )}
        </CardContent>
      </Card>

      {/* Fleet Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fleet – Vehicle Status Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              All vehicles with status and nearest document expiry.
            </p>
          </div>
          <ReportExportButtons
            report={fleetExport}
            disabled={fleetRows.length === 0}
            exporting={exporting}
            runExport={runExport}
          />
        </CardHeader>
        <CardContent>
          {fleetLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-5 text-primary" />
            </div>
          ) : fleetError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load fleet report.</span>
            </div>
          ) : fleetRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No vehicles found.</p>
          ) : (
            <ReportDataTable
              rows={fleetRows}
              getRowKey={(row) => row.id}
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
                  render: (row) =>
                    row.nearestDocumentExpiry
                      ? new Date(row.nearestDocumentExpiry).toLocaleDateString("ro-RO")
                      : "—",
                },
                {
                  header: "Doc Type",
                  render: (row) => row.nearestDocumentType ?? "—",
                },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
