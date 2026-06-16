import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_UNIT, UNITS } from "@/lib/units";
import type { Product } from "@/types/stock.types";
import type { EditProductFormData } from "./useProductsController";

interface ProductEditDialogProps {
  editIsActive?: boolean;
  editUnit?: string;
  editing: Product | null;
  form: UseFormReturn<EditProductFormData>;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: EditProductFormData) => Promise<void>;
  saving: boolean;
}

export function ProductEditDialog({
  editIsActive,
  editUnit,
  editing,
  form,
  onOpenChange,
  onSubmit,
  saving,
}: ProductEditDialogProps) {
  return (
    <Dialog open={Boolean(editing)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit product
            {editing ? (
              <span className="ml-2 font-mono text-xs text-slate-500">
                {editing.sku}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>
        {editing && (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                {...form.register("name", { required: true })}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input id="edit-category" {...form.register("category")} />
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit</Label>
                <Select
                  value={editUnit || DEFAULT_UNIT}
                  onValueChange={(value) =>
                    form.setValue("unit", value, { shouldDirty: true })
                  }
                >
                  <SelectTrigger id="edit-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editing &&
                      !UNITS.find((unit) => unit.value === editing.unit) && (
                        <SelectItem value={editing.unit}>
                          {editing.unit} (legacy)
                        </SelectItem>
                      )}
                    {UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-min">Minimum stock</Label>
                <Input
                  id="edit-min"
                  type="number"
                  step="0.01"
                  {...form.register("minimumStock", {
                    valueAsNumber: true,
                  })}
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Unit price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  {...form.register("unitPrice", {
                    valueAsNumber: true,
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-desc">Description</Label>
              <Input id="edit-desc" {...form.register("description")} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-active"
                checked={editIsActive}
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked === true, {
                    shouldDirty: true,
                  })
                }
              />
              <Label
                htmlFor="edit-active"
                className="text-sm font-normal text-slate-700"
              >
                Active (uncheck to discontinue this product)
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
