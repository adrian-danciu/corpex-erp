import { useQuery } from "@apollo/client/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type {
  FinanceOverviewQueryResult,
  Invoice,
  InvoicesQueryResult,
} from "@/types/finance.types";
import {
  FINANCE_OVERVIEW_QUERY,
  RECENT_FINANCE_INVOICES_QUERY,
} from "@/graphql/queries/finance.queries";
import { formatCurrency } from "@/lib/formatters";

type RecentInvoiceTableProps = {
  invoices: Invoice[];
  emptyLabel: string;
  onInvoiceClick: (invoiceId: string) => void;
};

function RecentInvoiceTable({
  invoices,
  emptyLabel,
  onInvoiceClick,
}: RecentInvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
        <p className="font-medium">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <Table className="min-w-[1000px]">
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Partner</TableHead>
          <TableHead>Issue Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow
            key={invoice.id}
            className="cursor-pointer"
            onClick={() => onInvoiceClick(invoice.id)}
          >
            <TableCell className="font-medium text-slate-900">
              {invoice.series}-{String(invoice.number).padStart(4, "0")}
            </TableCell>
            <TableCell className="text-slate-700">{invoice.partner.name}</TableCell>
            <TableCell className="text-slate-600">{invoice.issueDate}</TableCell>
            <TableCell className="text-slate-600">{invoice.dueDate}</TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(invoice.total, invoice.currency)}
            </TableCell>
            <TableCell className="text-center">
              <InvoiceStatusBadge status={invoice.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function FinanceOverviewPage() {
  const navigate = useNavigate();
  const { data: overviewData, loading: overviewLoading, error: overviewError } =
    useQuery<FinanceOverviewQueryResult>(FINANCE_OVERVIEW_QUERY);
  const {
    data: clientData,
    loading: clientLoading,
    error: clientError,
  } = useQuery<InvoicesQueryResult>(RECENT_FINANCE_INVOICES_QUERY, {
    variables: { pagination: { take: 5 }, isClientInvoice: true },
  });
  const {
    data: supplierData,
    loading: supplierLoading,
    error: supplierError,
  } = useQuery<InvoicesQueryResult>(RECENT_FINANCE_INVOICES_QUERY, {
    variables: { pagination: { take: 5 }, isClientInvoice: false },
  });

  if (overviewLoading || clientLoading || supplierLoading) {
    return <PageLoading message="Loading finance overview..." />;
  }

  if (overviewError || clientError || supplierError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load financial data</p>
      </div>
    );
  }

  const overview = overviewData?.financeOverview;
  const recentClientInvoices = clientData?.invoices.items ?? [];
  const recentSupplierInvoices = supplierData?.invoices.items ?? [];
  const now = new Date();

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
          <Button onClick={() => navigate("/finance/client-invoices/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Client Invoice
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/finance/supplier-invoices/new")}
            className="gap-2"
          >
            <Receipt className="h-4 w-4" />
            Add Supplier Invoice
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
              {formatCurrency(overview?.totalReceivable ?? 0)}
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
              {formatCurrency(overview?.totalPayable ?? 0)}
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
              {formatCurrency(overview?.overdueAmount ?? 0)}
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
            <div className="text-2xl font-bold">{overview?.invoicesThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Issued in {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Client Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Client Invoices</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/finance/client-invoices")}>
            View Client Invoices
          </Button>
        </CardHeader>
        <CardContent>
          <RecentInvoiceTable
            invoices={recentClientInvoices}
            emptyLabel="No client invoices yet"
            onInvoiceClick={(invoiceId) => navigate(`/finance/invoices/${invoiceId}`)}
          />
        </CardContent>
      </Card>

      {/* Recent Supplier Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Supplier Invoices</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate("/finance/supplier-invoices")}>
            View Supplier Invoices
          </Button>
        </CardHeader>
        <CardContent>
          <RecentInvoiceTable
            invoices={recentSupplierInvoices}
            emptyLabel="No supplier invoices yet"
            onInvoiceClick={(invoiceId) => navigate(`/finance/invoices/${invoiceId}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
