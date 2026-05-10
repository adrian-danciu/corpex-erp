import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { AlertCircle, Briefcase, Users as UsersIcon, FileText, AlertTriangle } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { FleetExpiryWidget } from "@/components/dashboard/FleetExpiryWidget";
import { MyProjectsWidget } from "@/components/dashboard/MyProjectsWidget";
import { MyTasksWidget } from "@/components/dashboard/MyTasksWidget";
import { NotificationsWidget } from "@/components/dashboard/NotificationsWidget";
import { useAuthStore } from "@/stores/auth.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";

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

const HR_LEAVE_SUMMARY_QUERY = gql`
  query HrLeaveSummaryDash {
    hrLeaveSummary {
      status
      count
    }
  }
`;

const FINANCE_AGING_QUERY = gql`
  query FinanceAgingSummaryDash {
    financeAgingSummary {
      label
      amount
      invoiceCount
    }
  }
`;

const LEAVE_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
  CANCELLED: "#94a3b8",
};

function formatRON(value: number) {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency: "RON", maximumFractionDigits: 0 }).format(value);
}

function KpiCard({ title, value, sub, icon, accent }: { title: string; value: string | number; sub: string; icon?: React.ReactNode; accent?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, loading, error } = useQuery<{
    dashboardMetrics: {
      totalUsers: number;
      totalEmployees: number;
      pendingLeaveRequests: number;
      approvedLeaveThisMonth: number;
      totalInvoices: number;
      overdueInvoices: number;
      totalInvoicedAmount: number;
      totalPaidAmount: number;
    };
  }>(DASHBOARD_METRICS_QUERY);

  const { data: hrData } = useQuery<{ hrLeaveSummary: { status: string; count: number }[] }>(HR_LEAVE_SUMMARY_QUERY);
  const { data: agingData } = useQuery<{ financeAgingSummary: { label: string; amount: number; invoiceCount: number }[] }>(FINANCE_AGING_QUERY);

  const metrics = data?.dashboardMetrics;
  const leaveRows = hrData?.hrLeaveSummary ?? [];
  const agingRows = agingData?.financeAgingSummary ?? [];

  const outstanding = metrics ? metrics.totalInvoicedAmount - metrics.totalPaidAmount : 0;
  const financeBarData = metrics
    ? [{ name: "Paid", value: metrics.totalPaidAmount }, { name: "Outstanding", value: outstanding }]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-2">
          Welcome back, {user?.firstName}! Here's what's happening today.
        </p>
      </div>

      {loading && <PageLoading message="Loading dashboard..." />}

      {error && !loading && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span>Failed to load dashboard metrics.</span>
        </div>
      )}

      {metrics && !loading && !error && (
        <>
          {/* KPI Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              title="Total Invoices"
              value={metrics.totalInvoices}
              sub="Across all partners"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Overdue Invoices"
              value={metrics.overdueInvoices}
              sub="Past due date, unpaid"
              accent={metrics.overdueInvoices > 0 ? "text-red-600" : ""}
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
            />
            <KpiCard
              title="Total Invoiced"
              value={formatRON(metrics.totalInvoicedAmount)}
              sub="Sum of all invoice totals"
            />
            <KpiCard
              title="Total Collected"
              value={formatRON(metrics.totalPaidAmount)}
              sub="Payments received"
              accent="text-green-700"
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Finance: Paid vs Outstanding */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Finance – Collected vs Outstanding</CardTitle>
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
                    <Tooltip formatter={(v) => formatRON(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-500" />Collected</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-amber-500" />Outstanding</span>
                </div>
              </CardContent>
            </Card>

            {/* HR: Leave by Status */}
            <Card>
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
                        label={({ name, value }: PieLabelRenderProps) => `${String(name).charAt(0) + String(name).slice(1).toLowerCase()} (${value})`}
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
              </CardContent>
            </Card>

            {/* Finance: Aging buckets */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Finance – Invoice Aging (RON)</CardTitle>
              </CardHeader>
              <CardContent>
                {agingRows.every((r) => r.amount === 0) ? (
                  <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">No outstanding invoices</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={agingRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatRON(Number(v))} />
                      <Bar dataKey="amount" fill="#ef4444" radius={[4, 4, 0, 0]} name="Outstanding" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notifications + Project widgets */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <NotificationsWidget />
            <MyProjectsWidget />
            <MyTasksWidget />
          </div>

          {/* Fleet Expiry Widget */}
          <FleetExpiryWidget />
        </>
      )}
    </div>
  );
}
