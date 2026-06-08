import { AlertCircle, ArrowLeft, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoading } from "@/components/ui/page-loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoiceDetailHeader } from "./invoice-detail/InvoiceDetailHeader";
import { InvoicePaymentsTab } from "./invoice-detail/InvoicePaymentsTab";
import { InvoiceSummary } from "./invoice-detail/InvoiceSummary";
import { useInvoiceDetailController } from "./invoice-detail/useInvoiceDetailController";

export default function InvoiceDetailPage() {
  const controller = useInvoiceDetailController();
  const {
    invoice,
    loading,
    error,
    remaining,
    labels,
    deleting,
    paymentLoading,
    cancelDialogOpen,
    deleteDialogOpen,
    goBack,
    recordPayment,
    confirmCancel,
    confirmDelete,
    setCancelDialogOpen,
    setDeleteDialogOpen,
  } = controller;

  if (loading) {
    return <PageLoading message="Loading invoice..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="mb-2 h-8 w-8" />
        <p>Failed to load invoice</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={goBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
        <div className="py-12 text-center text-slate-500">
          <Receipt className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-lg font-medium">Invoice not found</p>
          <p className="mt-1 text-sm">
            This invoice may not exist or you may not have access.
          </p>
        </div>
      </div>
    );
  }

  const invoiceNumber = `${invoice.series}-${String(invoice.number).padStart(4, "0")}`;

  return (
    <div className="space-y-6">
      <InvoiceDetailHeader {...controller} />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">
            Payments ({invoice.payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-6">
          <InvoiceSummary
            invoice={invoice}
            remaining={remaining}
            paidLabel={labels.paid}
            remainingLabel={labels.remaining}
            deleting={deleting}
            onDelete={() => setDeleteDialogOpen(true)}
          />
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <InvoicePaymentsTab
            invoice={invoice}
            remaining={remaining}
            paidLabel={labels.paid}
            remainingLabel={labels.remaining}
            emptyPaymentText={labels.emptyPayment}
            paymentButtonLabel={labels.paymentButton}
            paymentDialogTitle={labels.paymentDialog}
            paymentLoading={paymentLoading}
            onRecordPayment={recordPayment}
          />
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel invoice?"
        description={`This will mark invoice ${invoiceNumber} as cancelled. It will no longer count as active billing, but its history will remain visible.`}
        confirmLabel="Cancel invoice"
        onConfirm={confirmCancel}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete draft invoice?"
        description={`This permanently deletes draft ${invoiceNumber} and its line items. This action cannot be undone.`}
        confirmLabel="Delete draft"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
