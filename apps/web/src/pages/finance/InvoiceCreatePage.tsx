import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvoiceDirection } from "@/lib/invoice-direction";
import { ClientProjectSection } from "./invoice-create/ClientProjectSection";
import { InvoiceDetailsSection } from "./invoice-create/InvoiceDetailsSection";
import { InvoiceItemsSection } from "./invoice-create/InvoiceItemsSection";
import { SupplierProcurementSection } from "./invoice-create/SupplierProcurementSection";
import { useInvoiceCreateController } from "./invoice-create/useInvoiceCreateController";

type InvoiceCreatePageProps = {
  invoiceDirection?: InvoiceDirection;
};

export default function InvoiceCreatePage({
  invoiceDirection = "client",
}: InvoiceCreatePageProps) {
  const controller = useInvoiceCreateController(invoiceDirection);
  const {
    cancel,
    directionConfig,
    isClientMode,
    isLoading,
    submit,
  } = controller;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={cancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {directionConfig.createTitle}
          </h1>
          <p className="mt-1 text-slate-600">
            {directionConfig.createDescription}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <InvoiceDetailsSection {...controller} />

        {isClientMode ? (
          <ClientProjectSection {...controller} />
        ) : (
          <SupplierProcurementSection {...controller} />
        )}

        <InvoiceItemsSection {...controller} />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={cancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              directionConfig.submitLabel
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
