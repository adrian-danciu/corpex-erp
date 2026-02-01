import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Receipt, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import InvoiceStatusBadge from "@/components/finance/InvoiceStatusBadge";
import { InvoiceStatus, InvoiceType } from "@/types/finance.types";

// Mock data
const mockInvoices = [
  { id: "1", series: "CORP", number: 1001, invoiceType: InvoiceType.FISCAL, partner: "SC Alpha Distribution SRL", issueDate: "2026-01-28", dueDate: "2026-02-28", total: 5_400.0, paidAmount: 0, currency: "RON", status: InvoiceStatus.SENT, isClientInvoice: true },
  { id: "2", series: "CORP", number: 1002, invoiceType: InvoiceType.FISCAL, partner: "SC Beta Logistics SA", issueDate: "2026-01-25", dueDate: "2026-02-25", total: 12_750.0, paidAmount: 12_750.0, currency: "RON", status: InvoiceStatus.PAID, isClientInvoice: true },
  { id: "3", series: "CORP", number: 1003, invoiceType: InvoiceType.FISCAL, partner: "SC Gamma Services SRL", issueDate: "2026-01-20", dueDate: "2026-01-30", total: 3_200.0, paidAmount: 0, currency: "RON", status: InvoiceStatus.OVERDUE, isClientInvoice: true },
  { id: "4", series: "CORP", number: 1004, invoiceType: InvoiceType.PROFORMA, partner: "SC Delta Manufacturing SRL", issueDate: "2026-01-15", dueDate: "2026-02-15", total: 8_900.0, paidAmount: 4_000.0, currency: "RON", status: InvoiceStatus.PARTIALLY_PAID, isClientInvoice: true },
  { id: "5", series: "CORP", number: 1005, invoiceType: InvoiceType.FISCAL, partner: "SC Epsilon SA", issueDate: "2026-01-10", dueDate: "2026-02-10", total: 1_600.0, paidAmount: 0, currency: "RON", status: InvoiceStatus.DRAFT, isClientInvoice: true },
  { id: "6", series: "CORP", number: 1006, invoiceType: InvoiceType.FISCAL, partner: "SC Alpha Distribution SRL", issueDate: "2026-01-05", dueDate: "2026-02-05", total: 22_000.0, paidAmount: 22_000.0, currency: "RON", status: InvoiceStatus.PAID, isClientInvoice: false },
];

function formatCurrency(amount: number, currency = "RON") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${invoice.series}-${invoice.number}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "ALL" || invoice.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);

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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.key}
                  variant={filterStatus === filter.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus(filter.key)}
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-slate-600">
                    <th className="pb-3">Invoice #</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Partner</th>
                    <th className="pb-3">Issue Date</th>
                    <th className="pb-3">Due Date</th>
                    <th className="pb-3 text-right">Total</th>
                    <th className="pb-3 text-right">Paid</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() => navigate(`/finance/invoices/${invoice.id}`)}
                    >
                      <td className="py-3 font-medium text-slate-900">
                        {invoice.series}-{String(invoice.number).padStart(4, "0")}
                      </td>
                      <td className="py-3 text-slate-600 text-xs uppercase">{invoice.invoiceType}</td>
                      <td className="py-3 text-slate-700">{invoice.partner}</td>
                      <td className="py-3 text-slate-600">{invoice.issueDate}</td>
                      <td className="py-3 text-slate-600">{invoice.dueDate}</td>
                      <td className="py-3 text-right font-medium">{formatCurrency(invoice.total, invoice.currency)}</td>
                      <td className="py-3 text-right text-slate-600">{formatCurrency(invoice.paidAmount, invoice.currency)}</td>
                      <td className="py-3 text-center">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="py-3">
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
