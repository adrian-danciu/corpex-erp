import { useMutation, useQuery } from "@apollo/client/react";
import { Controller, useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
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
import type { PaginatedResult } from "@/types/pagination.types";
import type { Product, StockMovement, StockMovementType, Warehouse } from "@/types/stock.types";
import { StockMovementType as StockMovementTypeEnum } from "@/types/stock.types";
import { usePagination } from "@/hooks/usePagination";

interface StockMovementFormData {
  productId: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
}

export default function StockMovementsPage() {
  const { skip, take } = usePagination({ defaultPageSize: 20 });

  const { data: productsData } = useQuery<{ products: PaginatedResult<Product> }>(
    GET_PRODUCTS_QUERY,
    {
      variables: { pagination: { skip: 0, take: 200 } },
      fetchPolicy: "cache-first",
    }
  );
  const { data: warehousesData } = useQuery<{ warehouses: PaginatedResult<Warehouse> }>(
    GET_WAREHOUSES_QUERY,
    {
      variables: { pagination: { skip: 0, take: 100 } },
      fetchPolicy: "cache-first",
    }
  );

  const {
    data: movementsData,
    loading,
    error,
    refetch,
  } = useQuery<{ stockMovements: StockMovement[] }>(GET_STOCK_MOVEMENTS_QUERY, {
    variables: { pagination: { skip, take } },
    fetchPolicy: "cache-and-network",
  });

  const [createStockMovement, { loading: creating }] = useMutation<{
    createStockMovement: StockMovement;
  }>(CREATE_STOCK_MOVEMENT_MUTATION);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockMovementFormData>({
    defaultValues: {
      productId: "",
      warehouseId: "",
      type: StockMovementTypeEnum.IN,
      quantity: 1,
      unitCost: undefined,
      reference: "",
      notes: "",
    },
  });

  const onSubmit = async (values: StockMovementFormData) => {
    await createStockMovement({
      variables: {
        createStockMovementInput: {
          ...values,
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
      type: StockMovementTypeEnum.IN,
      quantity: 1,
      unitCost: undefined,
      reference: "",
      notes: "",
    });
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-600">Loading stock movements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load stock movements</p>
      </div>
    );
  }

  const products = productsData?.products.items ?? [];
  const warehouses = warehousesData?.warehouses.items ?? [];
  const movements = movementsData?.stockMovements ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Stock Movements</h1>
        <p className="text-slate-600 mt-1">Record incoming, outgoing and adjustment operations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Register Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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

              <div className="space-y-2">
                <Label>Type *</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as StockMovementType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={StockMovementTypeEnum.IN}>IN</SelectItem>
                        <SelectItem value={StockMovementTypeEnum.OUT}>OUT</SelectItem>
                        <SelectItem value={StockMovementTypeEnum.ADJUSTMENT}>
                          ADJUSTMENT
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.01"
                  {...register("quantity", {
                    required: "Quantity is required",
                    valueAsNumber: true,
                    min: { value: 0.01, message: "Quantity must be > 0" },
                  })}
                />
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
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...register("notes")} />
              </div>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? "Saving..." : "Register Movement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="text-sm text-slate-500">No stock movements yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Date</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Product</th>
                    <th className="py-2">Warehouse</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-b last:border-0">
                      <td className="py-2">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2">{movement.type}</td>
                      <td className="py-2">
                        {movement.product.sku} - {movement.product.name}
                      </td>
                      <td className="py-2">{movement.warehouse.code}</td>
                      <td className="py-2">{movement.quantity}</td>
                      <td className="py-2">
                        {movement.createdBy.firstName} {movement.createdBy.lastName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
