import { useQuery } from "@apollo/client/react";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CREATE_STOCK_MOVEMENT_MUTATION,
  GET_PRODUCTS_QUERY,
  GET_STOCK_MOVEMENTS_QUERY,
  GET_WAREHOUSES_QUERY,
} from "@/graphql/mutations/stock.mutations";
import type {
  CreateStockMovementMutationResult,
  ProductsQueryResult,
  WarehousesQueryResult,
} from "@/types/stock.types";
import { StockMovementType as StockMovementTypeEnum } from "@/types/stock.types";

type StockAdjustmentFormData = {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
};

export default function StockAdjustmentPage() {
  const { data: productsData } = useQuery<ProductsQueryResult>(
    GET_PRODUCTS_QUERY,
    {
    variables: { pagination: { skip: 0, take: 200 } },
    fetchPolicy: "cache-first",
  });
  const { data: warehousesData } = useQuery<WarehousesQueryResult>(
    GET_WAREHOUSES_QUERY,
    {
    variables: { pagination: { skip: 0, take: 100 } },
    fetchPolicy: "cache-first",
  });

  const [createStockMovement, { loading: creating }] =
    useMutationWithToast<CreateStockMovementMutationResult>(
      CREATE_STOCK_MOVEMENT_MUTATION,
      {
    refetchQueries: [{ query: GET_STOCK_MOVEMENTS_QUERY }],
    successMessage: "Adjustment registered",
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockAdjustmentFormData>({
    defaultValues: {
      productId: "",
      warehouseId: "",
      quantity: 1,
      unitCost: undefined,
      reference: "",
      notes: "",
    },
  });

  const products = productsData?.products.items ?? [];
  const warehouses = warehousesData?.warehouses.items ?? [];

  const onSubmit = async (values: StockAdjustmentFormData) => {
    try {
      await createStockMovement({
        variables: {
          createStockMovementInput: {
            ...values,
            type: StockMovementTypeEnum.ADJUSTMENT,
            quantity: Number(values.quantity),
            unitCost: values.unitCost ? Number(values.unitCost) : undefined,
            reference: values.reference || undefined,
            notes: values.notes || undefined,
          },
        },
      });
      reset({
        productId: "",
        warehouseId: "",
        quantity: 1,
        unitCost: undefined,
        reference: "",
        notes: "",
      });
    } catch {
      // toast already shown
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Stock Adjustment</h1>
        <p className="text-slate-600 mt-1">
          Admin-only correction workflow for inventory discrepancies.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Register Adjustment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Product *</Label>
                <Controller
                  name="productId"
                  control={control}
                  rules={{ required: "Product is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.productId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.sku} - {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Warehouse *</Label>
                <Controller
                  name="warehouseId"
                  control={control}
                  rules={{ required: "Warehouse is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={errors.warehouseId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.code} - {warehouse.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Corrected Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  {...register("quantity", {
                    required: "Quantity is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Quantity cannot be negative" },
                  })}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  {...register("unitCost", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference</Label>
                <Input id="reference" {...register("reference")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Reason / Notes</Label>
                <Input id="notes" {...register("notes")} />
              </div>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? "Saving..." : "Register Adjustment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
