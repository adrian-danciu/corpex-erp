import { useQuery } from "@apollo/client/react";
import { AlertTriangle, Briefcase, FileText, Users as UsersIcon } from "lucide-react";
import { InlineError } from "@/components/common/InlineError";
import { PageLoading } from "@/components/ui/page-loading";
import { FleetExpiryWidget } from "@/components/dashboard/FleetExpiryWidget";
import { FinanceAgingChart } from "@/components/dashboard/FinanceAgingChart";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { MyProjectsWidget } from "@/components/dashboard/MyProjectsWidget";
import { MyTasksWidget } from "@/components/dashboard/MyTasksWidget";
import { NotificationsWidget } from "@/components/dashboard/NotificationsWidget";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import {
  DASHBOARD_METRICS_QUERY,
  FINANCE_AGING_DASHBOARD_QUERY,
  HR_LEAVE_SUMMARY_DASHBOARD_QUERY,
  SUPPLIER_AGING_DASHBOARD_QUERY,
} from "@/graphql/queries/dashboard.queries";
import {
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type {
  DashboardMetricsQueryResult,
  FinanceAgingQueryResult,
  HrLeaveSummaryQueryResult,
  SupplierAgingQueryResult,
} from "@/types/report.types";

const LEAVE_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  CANCELLED: "#94a3b8",
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, loading, error } = useQuery<DashboardMetricsQueryResult>(
    DASHBOARD_METRICS_QUERY,
  );

  const { data: hrData } = useQuery<HrLeaveSummaryQueryResult>(
    HR_LEAVE_SUMMARY_DASHBOARD_QUERY,
  );
  const { data: agingData } = useQuery<FinanceAgingQueryResult>(
    FINANCE_AGING_DASHBOARD_QUERY,
  );
  const { data: supplierAgingData } = useQuery<SupplierAgingQueryResult>(
    SUPPLIER_AGING_DASHBOARD_QUERY,
  );

  const metrics = data?.dashboardMetrics;
  const leaveRows = hrData?.hrLeaveSummary ?? [];
  const agingRows = agingData?.financeAgingSummary ?? [];
  const supplierAgingRows = supplierAgingData?.supplierAgingSummary ?? [];

  const outstanding = metrics ? metrics.totalInvoicedAmount - metrics.totalPaidAmount : 0;
  const financeBarData = metrics
    ? [{ name: "Paid", value: metrics.totalPaidAmount }, { name: "Outstanding", value: outstanding }]
    : [];
  const supplierOutstanding = metrics ? metrics.totalPayableAmount - metrics.totalSupplierPaidAmount : 0;
  const supplierFinanceBarData = metrics
    ? [{ name: "Paid", value: metrics.totalSupplierPaidAmount }, { name: "Outstanding", value: supplierOutstanding }]
    : [];

  return (
    <div className="min-w-0 space-y-8">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-2">
          Welcome back, {user?.firstName}! Here's what's happening today.
        </p>
      </div>

      {loading && <PageLoading message="Loading dashboard..." />}

      {error && !loading && (
        <InlineError>Failed to load dashboard metrics.</InlineError>
      )}

      {metrics && !loading && !error && (
        <>
          {/* KPI Grid */}
          <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Users"
              value={metrics.totalUsers}
              sub="Active accounts in the system"
              icon={<UsersIcon className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Employees"
              value={metrics.totalEmployees}
              sub="Employee records"
              icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Pending Leave Requests"
              value={metrics.pendingLeaveRequests}
              sub="Waiting for manager approval"
              accent={metrics.pendingLeaveRequests > 0 ? "text-amber-600" : ""}
            />
            <KpiCard
              title="Approved Leave This Month"
              value={metrics.approvedLeaveThisMonth}
              sub="Approved in current month"
            />
            <KpiCard
              title="Client Invoices"
              value={metrics.totalInvoices}
              sub="Active receivable invoices"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Overdue Client Invoices"
              value={metrics.overdueInvoices}
              sub="Past due date, unpaid"
              accent={metrics.overdueInvoices > 0 ? "text-red-600" : ""}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Total Client Invoiced"
              value={formatCurrency(metrics.totalInvoicedAmount, "EUR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              sub="Sum of client invoice totals"
            />
            <KpiCard
              title="Total Collected"
              value={formatCurrency(metrics.totalPaidAmount, "EUR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              sub="Payments received"
              accent="text-green-700"
            />
            <KpiCard
              title="Supplier Invoices"
              value={metrics.totalSupplierInvoices}
              sub="Active payable invoices"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Overdue Supplier Invoices"
              value={metrics.overdueSupplierInvoices}
              sub="Past due date, unpaid"
              accent={metrics.overdueSupplierInvoices > 0 ? "text-red-600" : ""}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Total Supplier Invoiced"
              value={formatCurrency(metrics.totalPayableAmount, "EUR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              sub="Sum of supplier invoice totals"
            />
            <KpiCard
              title="Total Paid to Suppliers"
              value={formatCurrency(metrics.totalSupplierPaidAmount, "EUR", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              sub="Supplier payments recorded"
              accent="text-blue-700"
            />
          </div>

          <div className="grid min-w-0 items-stretch gap-6 lg:grid-cols-2">
            <Card className="w-full min-w-0">
              <CardHeader>
                <CardTitle className="text-base">Finance – Supplier Paid vs Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={supplierFinanceBarData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={false}
                      labelLine={false}
                    >
                      <Cell fill="#3b82f6" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v), "EUR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                    Paid
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    Outstanding
                  </span>
                </div>
              </CardContent>
            </Card>

            <FinanceAgingChart
              title="Finance – Supplier Payables Aging (EUR)"
              rows={supplierAgingRows}
              emptyLabel="No outstanding supplier invoices"
              barColor="#3b82f6"
              barName="Payable"
            />
          </div>

          {/* Charts row */}
          <div className="grid min-w-0 items-stretch gap-6 lg:grid-cols-3">
            {/* Finance: Paid vs Outstanding */}
            <Card className="w-full min-w-0">
              <CardHeader>
                <CardTitle className="text-base">Finance – Client Collected vs Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={financeBarData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      label={false}
                      labelLine={false}
                    >
                      <Cell fill="#22c55e" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v), "EUR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    Collected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                    Outstanding
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* HR: Leave by Status */}
            <Card className="w-full min-w-0">
              <CardHeader>
                <CardTitle className="text-base">HR – Leave Requests by Status</CardTitle>
              </CardHeader>
              <CardContent>
                {leaveRows.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">No leave data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={leaveRows}
                        cx="50%"
                        cy="50%"
                        outerRadius={75}
                        dataKey="count"
                        nameKey="status"
                        label={false}
                        labelLine={false}
                      >
                        {leaveRows.map((row) => (
                          <Cell key={row.status} fill={LEAVE_COLORS[row.status] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {leaveRows.length > 0 && (
                  <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-600">
                    {leaveRows.map((row) => (
                      <span key={row.status} className="flex items-center gap-1">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{
                            backgroundColor:
                              LEAVE_COLORS[row.status] ?? "#94a3b8",
                          }}
                        />
                        {String(row.status).charAt(0) +
                          String(row.status).slice(1).toLowerCase()}{" "}
                        ({row.count})
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Finance: Receivables aging buckets */}
            <FinanceAgingChart
              title="Finance – Client Receivables Aging (EUR)"
              rows={agingRows}
              emptyLabel="No outstanding client invoices"
              barColor="#ef4444"
              barName="Receivable"
            />
          </div>

          {/* Notifications + Project widgets */}
          <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NotificationsWidget />
            <MyProjectsWidget />
            <MyTasksWidget />
          </div>

          {/* Fleet Expiry Widget */}
          <div className="grid min-w-0 items-stretch gap-4">
            <FleetExpiryWidget />
          </div>
        </>
      )}
    </div>
  );
}
