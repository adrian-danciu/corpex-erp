import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Invoice } from "@/types/finance.types";
import { PaymentDialog } from "./PaymentDialog";

interface InvoicePaymentsTabProps {
  invoice: Invoice;
  remaining: number;
  paidLabel: string;
  remainingLabel: string;
  emptyPaymentText: string;
  paymentButtonLabel: string;
  paymentDialogTitle: string;
  paymentLoading: boolean;
  onRecordPayment: Parameters<typeof PaymentDialog>[0]["onRecordPayment"];
}

export function InvoicePaymentsTab({
  invoice,
  remaining,
  paidLabel,
  remainingLabel,
  emptyPaymentText,
  paymentButtonLabel,
  paymentDialogTitle,
  paymentLoading,
  onRecordPayment,
}: InvoicePaymentsTabProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Payment History</CardTitle>
        {remaining > 0 && (
          <PaymentDialog
            invoice={invoice}
            onRecordPayment={onRecordPayment}
            loading={paymentLoading}
            buttonLabel={paymentButtonLabel}
            title={paymentDialogTitle}
            outstandingLabel={remainingLabel}
          />
        )}
      </CardHeader>
      <CardContent>
        {invoice.payments.length === 0 ? (
          <div className="py-8 text-center text-slate-500">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-medium">No payments recorded</p>
            <p className="mt-1 text-sm">{emptyPaymentText}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell className="text-right font-medium text-green-700">
                    {formatCurrency(payment.amount, invoice.currency)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {payment.paymentMethod.replace("_", " ")}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {payment.reference || "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {payment.createdBy.firstName} {payment.createdBy.lastName}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Separator className="my-4" />
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Invoice Total:</span>
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>{paidLabel}:</span>
              <span>{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>{remainingLabel}:</span>
              <span
                className={
                  remaining > 0 ? "text-amber-700" : "text-green-700"
                }
              >
                {formatCurrency(remaining, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
