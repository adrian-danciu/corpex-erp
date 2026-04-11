import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/finance/InvoicePDF";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Send,
  CreditCard,
  XCircle,
  Receipt,
  Building2,
  Loader2,
  AlertCircle,
  Printer,
} from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import InvoiceStatusBadge from "@/components/finance/InvoiceStatusBadge";
import { InvoiceStatus, InvoiceType } from "@/types/finance.types";
import type { Invoice, InvoiceItem, Payment } from "@/types/finance.types";
import {
  GET_INVOICE_QUERY,
  GET_INVOICES_QUERY,
  UPDATE_INVOICE_STATUS_MUTATION,
  CREATE_PAYMENT_MUTATION,
  DELETE_INVOICE_MUTATION,
} from "@/graphql/mutations/finance.mutations";

function formatCurrency(amount: number, currency = "RON") {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency, minimumFractionDigits: 2 }).format(amount);
}

function PaymentDialog({ invoice, onRecordPayment, loading: paymentLoading }: { invoice: Invoice; onRecordPayment: (data: { amount: number; paymentDate: string; paymentMethod: string; reference: string }) => void; loading?: boolean }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(invoice.total - invoice.paidAmount));
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [reference, setReference] = useState("");

  const handleSubmit = () => {
    onRecordPayment({ amount: parseFloat(amount), paymentDate, paymentMethod, reference });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CreditCard className="h-4 w-4" />
          Record Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Outstanding: {formatCurrency(invoice.total - invoice.paidAmount, invoice.currency)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount *</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Date *</Label>
            <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Bank ref / receipt #" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={paymentLoading}>
            {paymentLoading ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery<{ invoice: Invoice | null }>(GET_INVOICE_QUERY, {
    variables: { id },
    skip: !id,
  });

  const [createPayment, { loading: paymentLoading }] = useMutation(CREATE_PAYMENT_MUTATION, {
    onCompleted: () => {
      refetch();
    },
  });

  const [updateStatus] = useMutation(UPDATE_INVOICE_STATUS_MUTATION, {
    refetchQueries: [{ query: GET_INVOICES_QUERY }],
    onCompleted: () => {
      refetch();
    },
  });

  const [deleteInvoice, { loading: deleting }] = useMutation(DELETE_INVOICE_MUTATION, {
    refetchQueries: [{ query: GET_INVOICES_QUERY }],
    onCompleted: () => {
      navigate("/finance/invoices");
    },
  });

  const [pdfLoading, setPdfLoading] = useState(false);

  if (loading) {
    return <PageLoading message="Loading invoice..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load invoice</p>
      </div>
    );
  }

  const invoice = data?.invoice;

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/finance/invoices")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </Button>
        <div className="text-center py-12 text-slate-500">
          <Receipt className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium">Invoice not found</p>
          <p className="text-sm mt-1">This invoice may not exist or you may not have access.</p>
        </div>
      </div>
    );
  }

  const remaining = invoice.total - invoice.paidAmount;

  const handlePrint = async () => {
    setPdfLoading(true);
    try {
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.series}-${String(invoice.number).padStart(4, "0")}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleRecordPayment = (data: { amount: number; paymentDate: string; paymentMethod: string; reference: string }) => {
    createPayment({
      variables: {
        createPaymentInput: {
          invoiceId: invoice.id,
          amount: data.amount,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          reference: data.reference || undefined,
        },
      },
    });
  };

  const handleMarkAsSent = () => {
    updateStatus({ variables: { id: invoice.id, status: InvoiceStatus.SENT } });
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this invoice?")) {
      updateStatus({ variables: { id: invoice.id, status: InvoiceStatus.CANCELLED } });
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      deleteInvoice({ variables: { id: invoice.id } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/finance/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">
                {invoice.series}-{String(invoice.number).padStart(4, "0")}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-slate-600 mt-1">
              {invoice.invoiceType === InvoiceType.FISCAL ? "Fiscal Invoice" : "Proforma Invoice"} — {invoice.isClientInvoice ? "Issued to client" : "Received from supplier"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handlePrint} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
            {pdfLoading ? "Generating..." : "Download PDF"}
          </Button>
          {invoice.status === InvoiceStatus.DRAFT && (
            <Button variant="outline" className="gap-2" onClick={handleMarkAsSent}>
              <Send className="h-4 w-4" /> Mark as Sent
            </Button>
          )}
          {(invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.PARTIALLY_PAID || invoice.status === InvoiceStatus.OVERDUE) && (
            <PaymentDialog invoice={invoice} onRecordPayment={handleRecordPayment} loading={paymentLoading} />
          )}
          {invoice.status !== InvoiceStatus.CANCELLED && invoice.status !== InvoiceStatus.PAID && (
            <Button variant="destructive" className="gap-2" onClick={handleCancel}>
              <XCircle className="h-4 w-4" /> Cancel
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({invoice.payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(invoice.total, invoice.currency)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Paid</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(invoice.paidAmount, invoice.currency)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Remaining</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(remaining, invoice.currency)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="text-2xl font-bold">{invoice.dueDate}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Partner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Partner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium text-lg">{invoice.partner.name}</p>
                <p className="text-sm text-slate-600 font-mono">CUI: {invoice.partner.cui}</p>
                {invoice.partner.regCom && <p className="text-sm text-slate-600">Reg. Com.: {invoice.partner.regCom}</p>}
                <p className="text-sm text-slate-600">{invoice.partner.address}</p>
                <p className="text-sm text-slate-600">{invoice.partner.city}, {invoice.partner.country}</p>
                {invoice.partner.bankAccount && (
                  <p className="text-sm text-slate-600 font-mono">IBAN: {invoice.partner.bankAccount}</p>
                )}
              </CardContent>
            </Card>

            {/* Invoice Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Issue Date</p>
                    <p className="font-medium">{invoice.issueDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Due Date</p>
                    <p className="font-medium">{invoice.dueDate}</p>
                  </div>
                  {invoice.deliveryDate && (
                    <div>
                      <p className="text-sm text-slate-500">Delivery Date</p>
                      <p className="font-medium">{invoice.deliveryDate}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-slate-500">Currency</p>
                    <p className="font-medium">{invoice.currency}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Created By</p>
                  <p className="font-medium">{invoice.createdBy.firstName} {invoice.createdBy.lastName}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-slate-600">
                      <th className="pb-3">#</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3 text-right">Qty</th>
                      <th className="pb-3">Unit</th>
                      <th className="pb-3 text-right">Unit Price</th>
                      <th className="pb-3 text-right">VAT %</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">VAT</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {invoice.items.map((item: InvoiceItem, index: number) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 text-slate-500">{index + 1}</td>
                        <td className="py-3">{item.description}</td>
                        <td className="py-3 text-right">{item.quantity}</td>
                        <td className="py-3">{item.unit}</td>
                        <td className="py-3 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                        <td className="py-3 text-right">{item.vatRate}%</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(item.amount, invoice.currency)}</td>
                        <td className="py-3 text-right">{formatCurrency(item.vatAmount, invoice.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">VAT:</span>
                    <span className="font-medium">{formatCurrency(invoice.vatTotal, invoice.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Delete */}
          <div className="flex justify-end">
            <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Invoice"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Payment History</CardTitle>
              {remaining > 0 && (
                <PaymentDialog invoice={invoice} onRecordPayment={handleRecordPayment} loading={paymentLoading} />
              )}
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No payments recorded</p>
                  <p className="text-sm mt-1">Record a payment to track progress.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm font-medium text-slate-600">
                        <th className="pb-3">Date</th>
                        <th className="pb-3 text-right">Amount</th>
                        <th className="pb-3">Method</th>
                        <th className="pb-3">Reference</th>
                        <th className="pb-3">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {invoice.payments.map((payment: Payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="py-3">{payment.paymentDate}</td>
                          <td className="py-3 text-right font-medium text-green-700">
                            {formatCurrency(payment.amount, invoice.currency)}
                          </td>
                          <td className="py-3 text-slate-600">
                            {payment.paymentMethod.replace("_", " ")}
                          </td>
                          <td className="py-3 text-slate-600 font-mono text-xs">
                            {payment.reference || "—"}
                          </td>
                          <td className="py-3 text-slate-600">
                            {payment.createdBy.firstName} {payment.createdBy.lastName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payment Summary */}
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Invoice Total:</span>
                    <span>{formatCurrency(invoice.total, invoice.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-700">
                    <span>Total Paid:</span>
                    <span>{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Outstanding:</span>
                    <span className={remaining > 0 ? "text-amber-700" : "text-green-700"}>
                      {formatCurrency(remaining, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
