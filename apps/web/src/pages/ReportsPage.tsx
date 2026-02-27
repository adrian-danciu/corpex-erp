import { gql} from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function ReportsPage() {
  const [leaveFilter, setLeaveFilter] = useState<string | "ALL">("ALL");

  const {
    data: hrData,
    loading: hrLoading,
    error: hrError,
  } = useQuery<{ hrLeaveSummary: { status: string; count: number }[] }>(
    HR_LEAVE_SUMMARY_QUERY
  );

  const {
    data: financeData,
    loading: financeLoading,
    error: financeError,
  } = useQuery<{
    financeAgingSummary: { label: string; amount: number; invoiceCount: number }[];
  }>(FINANCE_AGING_SUMMARY_QUERY);

  const leaveRows = hrData?.hrLeaveSummary ?? [];
  const agingRows = financeData?.financeAgingSummary ?? [];

  const filteredLeaveRows =
    leaveFilter === "ALL"
      ? leaveRows
      : leaveRows.filter((row: { status: string }) => row.status === leaveFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-slate-500 mt-2">
          HR and Finance reports based on current ERP data.
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
            <Select
              value={leaveFilter}
              onValueChange={(value) =>
                setLeaveFilter(value === "ALL" ? "ALL" : (value as string))
              }
            >
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
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
                  {filteredLeaveRows.map(
                    (row: { status: string; count: number }) => (
                      <tr key={row.status} className="border-b last:border-0">
                        <td className="py-2 font-medium">
                          {row.status.charAt(0) +
                            row.status.slice(1).toLowerCase()}
                        </td>
                        <td className="py-2 text-right">{row.count}</td>
                      </tr>
                    )
                  )}
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
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : financeError ? (
            <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load finance aging summary.</span>
            </div>
          ) : agingRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No outstanding invoices found.
            </p>
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
                  {agingRows.map(
                    (row: { label: string; amount: number; invoiceCount: number }) => (
                      <tr key={row.label} className="border-b last:border-0">
                        <td className="py-2 font-medium">{row.label}</td>
                        <td className="py-2 text-right">
                          {row.amount.toLocaleString("ro-RO", {
                            style: "currency",
                            currency: "RON",
                          })}
                        </td>
                        <td className="py-2 text-right">{row.invoiceCount}</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

