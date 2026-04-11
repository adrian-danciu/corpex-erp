import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { AlertCircle, Download } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const HR_LEAVE_SUMMARY_QUERY = gql`
  query HrLeaveSummary {
    hrLeaveSummary {
      status
      count
    }
  }
`;

const FINANCE_AGING_SUMMARY_QUERY = gql`
  query FinanceAgingSummary {
    financeAgingSummary {
      label
      amount
      invoiceCount
    }
  }
`;

const EMPLOYEE_REPORT_QUERY = gql`
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

const STOCK_REPORT_QUERY = gql`
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

const FLEET_REPORT_QUERY = gql`
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

type HrLeaveSummaryRow = { status: string; count: number };
type FinanceAgingRow = { label: string; amount: number; invoiceCount: number };
type EmployeeRow = {
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
type StockRow = {
  productId: string;
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
};
type FleetRow = {
  id: string;
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  nearestDocumentExpiry: string | null;
  nearestDocumentType: string | null;
};

function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const lines = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [leaveFilter, setLeaveFilter] = useState<string>("ALL");

  const { data: hrData, loading: hrLoading, error: hrError } =
    useQuery<{ hrLeaveSummary: HrLeaveSummaryRow[] }>(HR_LEAVE_SUMMARY_QUERY);

  const { data: financeData, loading: financeLoading, error: financeError } =
    useQuery<{ financeAgingSummary: FinanceAgingRow[] }>(FINANCE_AGING_SUMMARY_QUERY);

  const { data: employeeData, loading: employeeLoading, error: employeeError } =
    useQuery<{ employeeReport: EmployeeRow[] }>(EMPLOYEE_REPORT_QUERY);

  const { data: stockData, loading: stockLoading, error: stockError } =
    useQuery<{ stockReport: StockRow[] }>(STOCK_REPORT_QUERY);

  const { data: fleetData, loading: fleetLoading, error: fleetError } =
    useQuery<{ fleetReport: FleetRow[] }>(FLEET_REPORT_QUERY);

  const leaveRows = hrData?.hrLeaveSummary ?? [];
  const agingRows = financeData?.financeAgingSummary ?? [];
  const employeeRows = employeeData?.employeeReport ?? [];
  const stockRows = stockData?.stockReport ?? [];
  const fleetRows = fleetData?.fleetReport ?? [];

  const filteredLeaveRows =
    leaveFilter === "ALL" ? leaveRows : leaveRows.filter((r) => r.status === leaveFilter);

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaveRows.map((row) => (
                    <tr key={row.status} className="border-b last:border-0">
                      <td className="py-2 font-medium">
                        {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                      </td>
                      <td className="py-2 text-right">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Aging Bucket (days)</th>
                    <th className="py-2 text-right">Outstanding Amount (RON)</th>
                    <th className="py-2 text-right">Invoice Count</th>
                  </tr>
                </thead>
                <tbody>
                  {agingRows.map((row) => (
                    <tr key={row.label} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.label}</td>
                      <td className="py-2 text-right">
                        {row.amount.toLocaleString("ro-RO", { style: "currency", currency: "RON" })}
                      </td>
                      <td className="py-2 text-right">{row.invoiceCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <Button
            variant="outline"
            size="sm"
            disabled={employeeRows.length === 0}
            onClick={() =>
              exportCsv(
                "employee-report.csv",
                ["ID", "First Name", "Last Name", "Position", "Department", "Contract Type", "Employment Date", "Remaining Leave", "Annual Leave"],
                employeeRows.map((r) => [
                  r.id, r.firstName, r.lastName, r.position, r.department,
                  r.contractType, new Date(r.employmentDate).toLocaleDateString("ro-RO"),
                  String(r.remainingLeave), String(r.annualLeaveDays),
                ])
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Name</th>
                    <th className="py-2">Position</th>
                    <th className="py-2">Department</th>
                    <th className="py-2">Contract</th>
                    <th className="py-2">Employment Date</th>
                    <th className="py-2 text-right">Leave Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.firstName} {row.lastName}</td>
                      <td className="py-2">{row.position}</td>
                      <td className="py-2">{row.department}</td>
                      <td className="py-2">{row.contractType.replace("_", " ")}</td>
                      <td className="py-2">{new Date(row.employmentDate).toLocaleDateString("ro-RO")}</td>
                      <td className="py-2 text-right">{row.remainingLeave} / {row.annualLeaveDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <Button
            variant="outline"
            size="sm"
            disabled={stockRows.length === 0}
            onClick={() =>
              exportCsv(
                "stock-report.csv",
                ["Product ID", "Product Name", "SKU", "Warehouse", "Quantity"],
                stockRows.map((r) => [
                  r.productId, r.productName, r.sku, r.warehouseName, String(r.quantity),
                ])
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Product</th>
                    <th className="py-2">SKU</th>
                    <th className="py-2">Warehouse</th>
                    <th className="py-2 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRows.map((row) => (
                    <tr key={`${row.productId}-${row.warehouseName}`} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.productName}</td>
                      <td className="py-2 text-muted-foreground">{row.sku}</td>
                      <td className="py-2">{row.warehouseName}</td>
                      <td className="py-2 text-right font-medium">{row.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <Button
            variant="outline"
            size="sm"
            disabled={fleetRows.length === 0}
            onClick={() =>
              exportCsv(
                "fleet-report.csv",
                ["ID", "Plate Number", "Brand", "Model", "Year", "Status", "Nearest Doc Expiry", "Nearest Doc Type"],
                fleetRows.map((r) => [
                  r.id, r.plateNumber, r.brand, r.model, String(r.year), r.status,
                  r.nearestDocumentExpiry
                    ? new Date(r.nearestDocumentExpiry).toLocaleDateString("ro-RO")
                    : "",
                  r.nearestDocumentType ?? "",
                ])
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Plate</th>
                    <th className="py-2">Vehicle</th>
                    <th className="py-2">Year</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Nearest Doc Expiry</th>
                    <th className="py-2">Doc Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fleetRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{row.plateNumber}</td>
                      <td className="py-2">{row.brand} {row.model}</td>
                      <td className="py-2">{row.year}</td>
                      <td className="py-2">{row.status}</td>
                      <td className="py-2">
                        {row.nearestDocumentExpiry
                          ? new Date(row.nearestDocumentExpiry).toLocaleDateString("ro-RO")
                          : "—"}
                      </td>
                      <td className="py-2">{row.nearestDocumentType ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
