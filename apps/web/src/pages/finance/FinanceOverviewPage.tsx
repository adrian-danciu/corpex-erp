import { useQuery } from "@apollo/client/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Building2,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { useNavigate } from "react-router-dom";
import InvoiceStatusBadge from "@/components/finance/InvoiceStatusBadge";
import { InvoiceStatus } from "@/types/finance.types";
import type { Invoice } from "@/types/finance.types";
import { GET_INVOICES_QUERY } from "@/graphql/mutations/finance.mutations";
import { PaginatedResult } from "@/types/pagination.types";

function formatCurrency(amount: number, currency = "RON") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function FinanceOverviewPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useQuery<{ invoices: PaginatedResult<Invoice> }>(
    GET_INVOICES_QUERY,
    {
      variables: {
        pagination: { take: 50 }, // Fetch more items for overview stats
      },
    }
  );

  if (loading) {
    return <PageLoading message="Loading finance overview..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load financial data</p>
      </div>
    );
  }

  const invoices = data?.invoices.items || [];

  // Compute stats from real data
  const clientInvoices = invoices.filter((inv) => inv.isClientInvoice);
  const supplierInvoices = invoices.filter((inv) => !inv.isClientInvoice);

  const totalReceivable = clientInvoices
    .filter((inv) => inv.status !== InvoiceStatus.CANCELLED && inv.status !== InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const totalPayable = supplierInvoices
    .filter((inv) => inv.status !== InvoiceStatus.CANCELLED && inv.status !== InvoiceStatus.PAID)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const overdueAmount = invoices
    .filter((inv) => inv.status === InvoiceStatus.OVERDUE)
    .reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);

  const now = new Date();
  const invoicesThisMonth = invoices.filter((inv) => {
    const d = new Date(inv.issueDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Finance</h1>
          <p className="text-slate-600 mt-1">Financial overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/finance/partners/new")} className="gap-2">
            <Building2 className="h-4 w-4" />
            New Partner
          </Button>
          <Button onClick={() => navigate("/finance/invoices/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receivable</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(totalReceivable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From issued invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(totalPayable)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">To suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(overdueAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoicesThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Issued in {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Access */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/finance/partners")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-blue-50 p-3">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Partners</h3>
              <p className="text-sm text-slate-600">Manage clients and suppliers</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/finance/invoices")}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-lg bg-green-50 p-3">
              <Receipt className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Invoices</h3>
              <p className="text-sm text-slate-600">Create and manage invoices</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Invoices</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/finance/invoices")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {recentInvoices.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No invoices yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-slate-600">
                    <th className="pb-3">Invoice</th>
                    <th className="pb-3">Partner</th>
                    <th className="pb-3">Issue Date</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {recentInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      <td className="py-3 font-medium text-slate-900">
                        {invoice.series}-{String(invoice.number).padStart(4, "0")}
                      </td>
                      <td className="py-3 text-slate-700">{invoice.partner.name}</td>
                      <td className="py-3 text-slate-600">{invoice.issueDate}</td>
                      <td className="py-3 text-slate-600">{invoice.dueDate}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(invoice.total, invoice.currency)}</td>
                      <td className="py-3 text-center">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
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
