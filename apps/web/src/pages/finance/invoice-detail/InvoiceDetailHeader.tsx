import {
  ArrowLeft,
  Loader2,
  Printer,
  Send,
  XCircle,
} from "lucide-react";
import InvoiceStatusBadge from "@/components/finance/InvoiceStatusBadge";
import { Button } from "@/components/ui/button";
import { InvoiceStatus, InvoiceType } from "@/types/finance.types";
import { PaymentDialog } from "./PaymentDialog";
import type { InvoiceDetailController } from "./useInvoiceDetailController";

type InvoiceDetailHeaderProps = Pick<
  InvoiceDetailController,
  | "invoice"
  | "labels"
  | "paymentLoading"
  | "pdfLoading"
  | "goBack"
  | "downloadPdf"
  | "recordPayment"
  | "markAsSent"
  | "setCancelDialogOpen"
>;

export function InvoiceDetailHeader({
  invoice,
  labels,
  paymentLoading,
  pdfLoading,
  goBack,
  downloadPdf,
  recordPayment,
  markAsSent,
  setCancelDialogOpen,
}: InvoiceDetailHeaderProps) {
  if (!invoice) return null;

  const canRecordPayment = [
    InvoiceStatus.SENT,
    InvoiceStatus.PARTIALLY_PAID,
    InvoiceStatus.OVERDUE,
  ].includes(invoice.status);
  const canCancel =
    [InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.OVERDUE].includes(
      invoice.status,
    ) &&
    invoice.paidAmount === 0 &&
    invoice.payments.length === 0;

  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {invoice.series}-{String(invoice.number).padStart(4, "0")}
            </h1>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-1 text-slate-600">
            {invoice.invoiceType === InvoiceType.FISCAL
              ? "Fiscal Invoice"
              : "Proforma Invoice"}{" "}
            — {invoice.isClientInvoice ? "Issued to client" : "Received from supplier"}
          </p>
        </div>
      </div>
      <div className="flex w-full gap-2 overflow-x-auto pb-1 lg:w-auto lg:justify-end lg:overflow-visible">
        <Button
          variant="outline"
          className="shrink-0 gap-2"
          onClick={downloadPdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Printer className="h-4 w-4" />
          )}
          {pdfLoading ? "Generating..." : "Download PDF"}
        </Button>
        {invoice.status === InvoiceStatus.DRAFT && (
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            onClick={markAsSent}
          >
            <Send className="h-4 w-4" />
            {labels.statusAdvance}
          </Button>
        )}
        {canRecordPayment && (
          <PaymentDialog
            invoice={invoice}
            onRecordPayment={recordPayment}
            loading={paymentLoading}
            buttonLabel={labels.paymentButton}
            title={labels.paymentDialog}
            outstandingLabel={labels.remaining}
            triggerClassName="shrink-0"
          />
        )}
        {canCancel && (
          <Button
            variant="destructive"
            className="shrink-0 gap-2"
            onClick={() => setCancelDialogOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
