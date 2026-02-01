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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import InvoiceStatusBadge from "@/components/finance/InvoiceStatusBadge";
import { InvoiceStatus } from "@/types/finance.types";

// Mock data — will be replaced with API calls
const mockStats = {
  totalReceivable: 145_320.5,
  totalPayable: 87_650.0,
  overdueAmount: 12_480.0,
  invoicesThisMonth: 23,
};

const mockRecentInvoices = [
  { id: "1", series: "CORP", number: 1001, partner: "SC Alpha SRL", issueDate: "2026-01-28", dueDate: "2026-02-28", total: 5_400.0, status: InvoiceStatus.SENT },
  { id: "2", series: "CORP", number: 1002, partner: "SC Beta SA", issueDate: "2026-01-25", dueDate: "2026-02-25", total: 12_750.0, status: InvoiceStatus.PAID },
  { id: "3", series: "CORP", number: 1003, partner: "SC Gamma SRL", issueDate: "2026-01-20", dueDate: "2026-01-30", total: 3_200.0, status: InvoiceStatus.OVERDUE },
  { id: "4", series: "CORP", number: 1004, partner: "SC Delta SRL", issueDate: "2026-01-15", dueDate: "2026-02-15", total: 8_900.0, status: InvoiceStatus.PARTIALLY_PAID },
  { id: "5", series: "CORP", number: 1005, partner: "SC Epsilon SA", issueDate: "2026-01-10", dueDate: "2026-02-10", total: 1_600.0, status: InvoiceStatus.DRAFT },
];

function formatCurrency(amount: number, currency = "RON") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function FinanceOverviewPage() {
  const navigate = useNavigate();

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
              {formatCurrency(mockStats.totalReceivable)}
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
              {formatCurrency(mockStats.totalPayable)}
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
              {formatCurrency(mockStats.overdueAmount)}
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
            <div className="text-2xl font-bold">{mockStats.invoicesThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Issued in January 2026</p>
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
          <div className="overflow-x-auto">
            <table className="w-full">
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
                {mockRecentInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="border-b hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                  >
                    <td className="py-3 font-medium text-slate-900">
                      {invoice.series}-{String(invoice.number).padStart(4, "0")}
                    </td>
                    <td className="py-3 text-slate-700">{invoice.partner}</td>
                    <td className="py-3 text-slate-600">{invoice.issueDate}</td>
                    <td className="py-3 text-slate-600">{invoice.dueDate}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(invoice.total)}</td>
                    <td className="py-3 text-center">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
