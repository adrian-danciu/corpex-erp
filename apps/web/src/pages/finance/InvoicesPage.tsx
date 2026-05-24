import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Receipt, Search, AlertCircle } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { useNavigate } from "react-router-dom";
import InvoiceStatusBadge from "@/components/finance/InvoiceStatusBadge";
import { InvoiceStatus } from "@/types/finance.types";
import type { Invoice } from "@/types/finance.types";
import { GET_INVOICES_QUERY } from "@/graphql/mutations/finance.mutations";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { PaginatedResult } from "@/types/pagination.types";
import { formatCurrency } from "@/lib/formatters";

const statusFilters = [
  { key: "ALL", label: "All" },
  { key: InvoiceStatus.DRAFT, label: "Draft" },
  { key: InvoiceStatus.SENT, label: "Sent" },
  { key: InvoiceStatus.PAID, label: "Paid" },
  { key: InvoiceStatus.PARTIALLY_PAID, label: "Partial" },
  { key: InvoiceStatus.OVERDUE, label: "Overdue" },
  { key: InvoiceStatus.CANCELLED, label: "Cancelled" },
];

export default function InvoicesPage() {
  const navigate = useNavigate();
  const { getFilter, setFilter } = useUrlFilters();
  const searchQuery = getFilter("search");
  const rawStatus = getFilter("status", "ALL");
  const filterStatus = statusFilters.some((filter) => filter.key === rawStatus)
    ? rawStatus
    : "ALL";
  const { page, pageSize, skip, take, setPage } = usePagination();

  const { data, loading, error } = useQuery<{ invoices: PaginatedResult<Invoice> }>(
    GET_INVOICES_QUERY,
    {
      variables: {
        pagination: { skip, take },
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const filteredInvoices = useMemo(() => {
    const invoices = data?.invoices.items || [];
    return invoices.filter((invoice) => {
      const matchesSearch =
        invoice.partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${invoice.series}-${invoice.number}`.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === "ALL" || invoice.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [data?.invoices.items, searchQuery, filterStatus]);

  const totalItems = data?.invoices.meta.total || 0;

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

  if (loading) {
    return <PageLoading message="Loading invoices..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load invoices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoices</h1>
          <p className="text-slate-600 mt-1">Create and manage invoices</p>
        </div>
        <Button onClick={() => navigate("/finance/invoices/new")} className="gap-2">
          <Plus className="h-4 w-4" />
          New Invoice
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by partner or invoice number..."
                value={searchQuery}
                onChange={(e) =>
                  setFilter("search", e.target.value, { replace: true })
                }
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={filterStatus === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setFilter(
                      "status",
                      filter.key === "ALL" ? null : filter.key,
                    )
                  }
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">{filteredInvoices.length} invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{formatCurrency(totalAmount - totalPaid)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No invoices found</p>
              <p className="text-sm mt-1">
                {searchQuery || filterStatus !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "Get started by creating your first invoice"}
              </p>
            </div>
          ) : (
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                  >
                    <TableCell className="font-medium text-slate-900">
                        {invoice.series}-{String(invoice.number).padStart(4, "0")}
                    </TableCell>
                    <TableCell className="text-xs uppercase text-slate-600">{invoice.invoiceType}</TableCell>
                    <TableCell className="text-slate-700">{invoice.partner.name}</TableCell>
                    <TableCell className="text-slate-600">{invoice.issueDate}</TableCell>
                    <TableCell className="text-slate-600">{invoice.dueDate}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(invoice.total, invoice.currency)}</TableCell>
                    <TableCell className="text-right text-slate-600">{formatCurrency(invoice.paidAmount, invoice.currency)}</TableCell>
                    <TableCell className="text-center">
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/finance/invoices/${invoice.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
