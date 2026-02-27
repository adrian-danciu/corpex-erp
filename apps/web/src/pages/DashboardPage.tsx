import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { AlertCircle, Briefcase, Loader2, Users as UsersIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

const DASHBOARD_METRICS_QUERY = gql`
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
    }
  }
`;

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, loading, error } = useQuery<{ dashboardMetrics: {
    totalUsers: number;
    totalEmployees: number;
    pendingLeaveRequests: number;
    approvedLeaveThisMonth: number;
    totalInvoices: number;
    overdueInvoices: number;
    totalInvoicedAmount: number;
    totalPaidAmount: number;
  } }>(DASHBOARD_METRICS_QUERY);

  const metrics = data?.dashboardMetrics;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-2">
          Welcome back, {user?.firstName}! Here's what's happening today.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load dashboard metrics.</span>
        </div>
      )}

      {metrics && !loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Users</h3>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active accounts in the system</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Employees</h3>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{metrics.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Employees with active records</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Pending Leave Requests</h3>
            </div>
            <div className="text-2xl font-bold">{metrics.pendingLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">
              Requests waiting for manager approval
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Approved Leave This Month</h3>
            </div>
            <div className="text-2xl font-bold">{metrics.approvedLeaveThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Number of requests approved this month
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Invoices</h3>
            </div>
            <div className="text-2xl font-bold">{metrics.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Across all partners</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Overdue Invoices</h3>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {metrics.overdueInvoices}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices past due date and not fully paid
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Invoiced Amount</h3>
            </div>
            <div className="text-2xl font-bold">
              {metrics.totalInvoicedAmount.toLocaleString("ro-RO", {
                style: "currency",
                currency: "RON",
              })}
            </div>
            <p className="text-xs text-muted-foreground">Sum of all invoice totals</p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total Paid Amount</h3>
            </div>
            <div className="text-2xl font-bold">
              {metrics.totalPaidAmount.toLocaleString("ro-RO", {
                style: "currency",
                currency: "RON",
              })}
            </div>
            <p className="text-xs text-muted-foreground">Payments registered in the system</p>
          </div>
        </div>
      )}
    </div>
  );
}
