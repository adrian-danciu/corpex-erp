import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceCreateController } from "./useInvoiceCreateController";
import { formatDate } from "@/lib/formatters";

type SupplierProcurementSectionProps = Pick<
  InvoiceCreateController,
  | "form"
  | "partners"
  | "partnersLoading"
  | "filteredPurchaseOrders"
  | "selectedPurchaseOrder"
  | "selectedReceiptIds"
  | "importSupplierReceiptLines"
  | "selectPurchaseOrder"
  | "selectPartner"
  | "selectReceipt"
>;

export function SupplierProcurementSection({
  form,
  partners,
  partnersLoading,
  filteredPurchaseOrders,
  selectedPurchaseOrder,
  selectedReceiptIds,
  importSupplierReceiptLines,
  selectPurchaseOrder,
  selectPartner,
  selectReceipt,
}: SupplierProcurementSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Supplier & Procurement</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Supplier *</Label>
          <Controller
            name="partnerId"
            control={form.control}
            render={({ field }) => (
              <Select
                onValueChange={selectPartner}
                value={field.value}
                disabled={partnersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      partnersLoading
                        ? "Loading suppliers..."
                        : "Select a supplier"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} ({partner.cui})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.partnerId && (
            <p className="text-sm text-red-600">
              {form.formState.errors.partnerId.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Purchase order (optional)</Label>
          <Controller
            name="purchaseOrderId"
            control={form.control}
            render={({ field }) => (
              <Select
                onValueChange={selectPurchaseOrder}
                value={field.value || "__none__"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No purchase order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No purchase order</SelectItem>
                  {filteredPurchaseOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.formattedNumber} -{" "}
                      {order.supplier?.name ?? "Supplier"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label>NIR / receipts</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={importSupplierReceiptLines}
              disabled={!selectedReceiptIds.length}
            >
              Import selected
            </Button>
          </div>
          {!selectedPurchaseOrder ? (
            <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Select a purchase order first.
            </div>
          ) : selectedPurchaseOrder.receipts.length === 0 ? (
            <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
              No NIRs recorded for this purchase order.
            </div>
          ) : (
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
              {selectedPurchaseOrder.receipts.map((receipt) => {
                const checked = selectedReceiptIds.includes(receipt.id);
                const lineCount = receipt.lines?.length ?? 0;

                return (
                  <label
                    key={receipt.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        selectReceipt(receipt.id, value === true)
                      }
                    />
                    <span className="space-y-0.5 text-sm">
                      <span className="block font-medium text-slate-900">
                        {receipt.formattedNumber}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {formatDate(receipt.receivedDate)}{" "}
                        · {lineCount} line{lineCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <p className="text-xs text-slate-500">
            Selected NIR lines can auto-fill the invoice. You can still add
            manual charges below.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
