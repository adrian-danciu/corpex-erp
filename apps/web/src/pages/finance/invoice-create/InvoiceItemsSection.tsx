import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/formatters";
import type { InvoiceCreateController } from "./useInvoiceCreateController";

type InvoiceItemsSectionProps = Pick<
  InvoiceCreateController,
  "form" | "itemFields" | "itemTotals" | "subtotal" | "vatTotal" | "total"
>;

const emptyInvoiceItem = {
  description: "",
  quantity: 1,
  unit: "buc",
  unitPrice: 0,
  vatRate: 19,
} as const;

export function InvoiceItemsSection({
  form,
  itemFields,
  itemTotals,
  subtotal,
  vatTotal,
  total,
}: InvoiceItemsSectionProps) {
  const {
    register,
    formState: { errors },
  } = form;
  const { fields, append, remove } = itemFields;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Line Items</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(emptyInvoiceItem)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.items?.root && (
          <p className="text-sm text-red-600">{errors.items.root.message}</p>
        )}

        {fields.map((field, index) => (
          <div key={field.id} className="space-y-3">
            {index > 0 && <Separator />}
            <div className="grid items-end gap-3 md:grid-cols-12">
              <div className="space-y-1 md:col-span-4">
                <Label className="text-xs">Description *</Label>
                <Input
                  {...register(`items.${index}.description`)}
                  placeholder="Product or service description"
                />
                {errors.items?.[index]?.description && (
                  <p className="text-xs text-red-600">
                    {errors.items[index].description.message}
                  </p>
                )}
              </div>
              <div className="space-y-1 md:col-span-1">
                <Label className="text-xs">Qty *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.quantity`)}
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <Label className="text-xs">Unit</Label>
                <Input {...register(`items.${index}.unit`)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Unit Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.unitPrice`)}
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <Label className="text-xs">VAT %</Label>
                <Input
                  type="number"
                  {...register(`items.${index}.vatRate`)}
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <Label className="text-xs">Amount</Label>
                <div className="flex h-9 items-center rounded-md border bg-slate-50 px-3 text-sm font-medium">
                  {formatCurrency(itemTotals[index]?.amount || 0)}
                </div>
              </div>
              <div className="md:col-span-1">
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}

        <Separator className="my-4" />
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">VAT:</span>
              <span className="font-medium">{formatCurrency(vatTotal)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
