import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useForm, useWatch } from "react-hook-form";
import { AlertTriangle, PackageX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  GET_PRODUCT_STOCK_BY_PRODUCT_QUERY,
  GET_PRODUCTS_QUERY,
  GET_STOCK_OVERVIEW_QUERY,
  GET_LOW_STOCK_PRODUCTS_QUERY,
  MARK_STOCK_DEFECTIVE_MUTATION,
  SCRAP_DEFECTIVE_STOCK_MUTATION,
} from "@/graphql/mutations/stock.mutations";
import type { Product, ProductStockBreakdown } from "@/types/stock.types";

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

type Mode = "report" | "scrap";

interface FormValues {
  warehouseId: string;
  quantity: number;
  reason: string;
}

export function DefectiveStockSheet({ product, open, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("report");

  const { data, loading, refetch } = useQuery<{
    productStockByProduct: ProductStockBreakdown[];
  }>(GET_PRODUCT_STOCK_BY_PRODUCT_QUERY, {
    variables: { productId: product.id },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });

  const stocks = useMemo(
    () => data?.productStockByProduct ?? [],
    [data?.productStockByProduct],
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { warehouseId: "", quantity: 0, reason: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ warehouseId: "", quantity: 0, reason: "" });
    }
  }, [open, product.id, reset]);

  const selectedId = useWatch({ control, name: "warehouseId" });
  const quantity = useWatch({ control, name: "quantity" });
  const selected = stocks.find((s) => s.warehouseId === selectedId);

  const reportableCap = selected
    ? Math.max(
        0,
        selected.quantity - selected.reservedQty - selected.defectiveQty,
      )
    : 0;
  const scrapCap = selected?.defectiveQty ?? 0;
  const cap = mode === "report" ? reportableCap : scrapCap;

  const refetchOptions = {
    refetchQueries: [
      { query: GET_PRODUCT_STOCK_BY_PRODUCT_QUERY, variables: { productId: product.id } },
      { query: GET_PRODUCTS_QUERY, variables: { pagination: { skip: 0, take: 10 } } },
      { query: GET_STOCK_OVERVIEW_QUERY },
      { query: GET_LOW_STOCK_PRODUCTS_QUERY },
    ],
    awaitRefetchQueries: true,
  };

  const [markDefective] = useMutationWithToast(
    MARK_STOCK_DEFECTIVE_MUTATION,
    { successMessage: "Marked as defective", ...refetchOptions },
  );

  const [scrapDefective] = useMutationWithToast(
    SCRAP_DEFECTIVE_STOCK_MUTATION,
    { successMessage: "Defective units scrapped", ...refetchOptions },
  );

  const handleClose = () => {
    setMode("report");
    onClose();
  };

  const onSubmit = async (values: FormValues) => {
    const qty = Number(values.quantity);
    if (!values.warehouseId || qty <= 0) return;
    const variables = {
      input: {
        productId: product.id,
        warehouseId: values.warehouseId,
        quantity: qty,
        reason: values.reason || undefined,
      },
    };
    try {
      if (mode === "report") {
        await markDefective({ variables });
      } else {
        await scrapDefective({ variables });
      }
      reset({ warehouseId: values.warehouseId, quantity: 0, reason: "" });
      await refetch();
    } catch {
      // toast shown by hook
    }
  };

  const submitDisabled =
    isSubmitting ||
    !selected ||
    Number(quantity) <= 0 ||
    Number(quantity) > cap;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] p-0 gap-0 flex flex-col"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetHeader className="border-b border-slate-200 px-6 py-4 gap-1">
            <SheetDescription className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {product.sku} · {product.name}
            </SheetDescription>
            <SheetTitle className="text-xl font-semibold leading-tight text-slate-900">
              Defective stock
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setMode("report");
                  setValue("quantity", 0);
                }}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === "report"
                    ? "bg-white shadow-sm text-amber-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Report defective
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("scrap");
                  setValue("quantity", 0);
                }}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                  mode === "scrap"
                    ? "bg-white shadow-sm text-red-700"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Scrap defective
                </span>
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {mode === "report"
                ? "Move healthy units into the defective bucket. They stay in the warehouse but are no longer sellable."
                : "Permanently remove defective units from the warehouse. This decreases on-hand stock."}
            </p>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
                Per-warehouse breakdown
              </h3>
              {loading && stocks.length === 0 ? (
                <div className="flex items-center justify-center py-6">
                  <Spinner />
                </div>
              ) : stocks.length === 0 ? (
                <p className="text-sm text-slate-500">
                  This product has no warehouse records yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">On hand</TableHead>
                      <TableHead className="text-right">Reserved</TableHead>
                      <TableHead className="text-right">Defective</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.map((s) => {
                      const isSelected = s.warehouseId === selectedId;
                      return (
                        <TableRow
                          key={s.id}
                          onClick={() =>
                            setValue("warehouseId", s.warehouseId, {
                              shouldDirty: true,
                            })
                          }
                          className={`cursor-pointer ${
                            isSelected ? "bg-slate-50" : ""
                          }`}
                        >
                          <TableCell>
                            <div className="font-medium">{s.warehouse.code}</div>
                            <div className="text-xs text-slate-500">
                              {s.warehouse.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {s.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {s.reservedQty}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-amber-700">
                            {s.defectiveQty}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {s.availableQty}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="hidden"
                {...register("warehouseId", { required: true })}
              />
              <div className="space-y-1.5">
                <Label htmlFor="quantity">
                  Quantity {selected ? `(max ${cap} ${product.unit})` : ""}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.0001"
                  min="0"
                  max={cap || undefined}
                  inputMode="decimal"
                  disabled={!selected}
                  className={
                    errors.quantity || Number(quantity) > cap
                      ? "border-red-500"
                      : ""
                  }
                  {...register("quantity", {
                    valueAsNumber: true,
                    min: 0.0001,
                  })}
                />
                {!selected && (
                  <p className="text-xs text-slate-500">
                    Pick a warehouse from the table above.
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="reason">
                  Reason {mode === "report" ? "(optional)" : "(optional)"}
                </Label>
                <Textarea
                  id="reason"
                  rows={2}
                  placeholder={
                    mode === "report"
                      ? "Damaged in transit, expired, etc."
                      : "Disposed, returned to supplier, etc."
                  }
                  {...register("reason")}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-slate-200 px-6 py-3 mt-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled}
              variant={mode === "scrap" ? "destructive" : "default"}
            >
              {mode === "report" ? (
                <span className="inline-flex items-center gap-1.5">
                  <PackageX className="h-4 w-4" />
                  {isSubmitting ? "Reporting…" : "Mark as defective"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  {isSubmitting ? "Scrapping…" : "Scrap from stock"}
                </span>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
