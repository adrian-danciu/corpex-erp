import { Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CreatePurchaseOrderFormData } from "@/lib/schemas/purchaseOrder.schema";
import type { Product } from "@/types/stock.types";

interface Props {
  products: Pick<Product, "id" | "sku" | "name" | "unit">[];
  disabled?: boolean;
}

export function PurchaseOrderLineEditor({ products, disabled }: Props) {
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = useFormContext<CreatePurchaseOrderFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "lines",
  });

  const lines = watch("lines") ?? [];
  const subtotal = lines.reduce(
    (sum, line) =>
      sum + (Number(line.qtyOrdered) || 0) * (Number(line.unitCost) || 0),
    0,
  );

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[42%]">Product *</TableHead>
            <TableHead className="text-right">Qty *</TableHead>
            <TableHead className="text-right">Unit cost *</TableHead>
            <TableHead className="text-right">Line total</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-sm text-slate-500"
              >
                No line items yet. Add at least one product to continue.
              </TableCell>
            </TableRow>
          ) : (
            fields.map((field, index) => {
              const line = lines[index];
              const lineTotal =
                (Number(line?.qtyOrdered) || 0) *
                (Number(line?.unitCost) || 0);
              const productError = errors.lines?.[index]?.productId;
              const qtyError = errors.lines?.[index]?.qtyOrdered;
              const costError = errors.lines?.[index]?.unitCost;

              return (
                <TableRow key={field.id}>
                  <TableCell>
                    <Controller
                      control={control}
                      name={`lines.${index}.productId` as const}
                      render={({ field: f }) => (
                        <Select
                          value={f.value}
                          onValueChange={f.onChange}
                          disabled={disabled}
                        >
                          <SelectTrigger
                            className={productError ? "border-red-500" : ""}
                          >
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.sku} · {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.0001"
                      min="0"
                      inputMode="decimal"
                      className={`text-right ${qtyError ? "border-red-500" : ""}`}
                      disabled={disabled}
                      {...register(`lines.${index}.qtyOrdered` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      className={`text-right ${costError ? "border-red-500" : ""}`}
                      disabled={disabled}
                      {...register(`lines.${index}.unitCost` as const, {
                        valueAsNumber: true,
                      })}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium tabular-nums">
                    {lineTotal.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={disabled}
                      aria-label="Remove line"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            append({
              productId: "",
              qtyOrdered: 1,
              unitCost: 0,
              notes: "",
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add line
        </Button>
        <div className="text-sm">
          <span className="text-slate-500">Subtotal:</span>{" "}
          <span className="font-semibold tabular-nums">
            {subtotal.toFixed(2)}
          </span>
        </div>
      </div>

      {errors.lines && typeof errors.lines.message === "string" && (
        <p className="text-sm text-red-500">{errors.lines.message}</p>
      )}
    </div>
  );
}
