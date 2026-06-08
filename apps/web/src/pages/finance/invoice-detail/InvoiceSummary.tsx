import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { InvoiceStatus, type Invoice } from "@/types/finance.types";
import { InvoiceItemsTable } from "./InvoiceItemsTable";

interface InvoiceSummaryProps {
  invoice: Invoice;
  remaining: number;
  paidLabel: string;
  remainingLabel: string;
  deleting: boolean;
  onDelete: () => void;
}

export function InvoiceSummary({
  invoice,
  remaining,
  paidLabel,
  remainingLabel,
  deleting,
  onDelete,
}: InvoiceSummaryProps) {
  const canDelete =
    invoice.status === InvoiceStatus.DRAFT &&
    invoice.paidAmount === 0 &&
    invoice.payments.length === 0;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold">
              {formatCurrency(invoice.total, invoice.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">{paidLabel}</p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(invoice.paidAmount, invoice.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">{remainingLabel}</p>
            <p className="text-2xl font-bold text-amber-700">
              {formatCurrency(remaining, invoice.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-500">Due Date</p>
            <p className="text-2xl font-bold">{formatDate(invoice.dueDate)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Partner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-medium">{invoice.partner.name}</p>
            <p className="font-mono text-sm text-slate-600">
              CUI: {invoice.partner.cui}
            </p>
            {invoice.partner.regCom && (
              <p className="text-sm text-slate-600">
                Reg. Com.: {invoice.partner.regCom}
              </p>
            )}
            <p className="text-sm text-slate-600">{invoice.partner.address}</p>
            <p className="text-sm text-slate-600">
              {invoice.partner.city}, {invoice.partner.country}
            </p>
            {invoice.partner.bankAccount && (
              <p className="font-mono text-sm text-slate-600">
                IBAN: {invoice.partner.bankAccount}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-slate-500">Issue Date</p>
                <p className="font-medium">{formatDate(invoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="font-medium">{formatDate(invoice.dueDate)}</p>
              </div>
              {invoice.deliveryDate && (
                <div>
                  <p className="text-sm text-slate-500">Delivery Date</p>
                  <p className="font-medium">
                    {formatDate(invoice.deliveryDate)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-slate-500">Currency</p>
                <p className="font-medium">{invoice.currency}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500">Created By</p>
              <p className="font-medium">
                {invoice.createdBy.firstName} {invoice.createdBy.lastName}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <InvoiceItemsTable invoice={invoice} />

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

      {canDelete && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Draft"}
          </Button>
        </div>
      )}
    </>
  );
}
