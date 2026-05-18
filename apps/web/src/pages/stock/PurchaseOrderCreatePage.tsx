import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  CREATE_PURCHASE_ORDER_MUTATION,
  GET_PURCHASE_ORDERS_QUERY,
} from "@/graphql/mutations/purchaseOrders.mutations";
import { GET_PARTNERS_QUERY } from "@/graphql/mutations/finance.mutations";
import {
  GET_PRODUCTS_QUERY,
  GET_WAREHOUSES_QUERY,
} from "@/graphql/mutations/stock.mutations";
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderFormData,
} from "@/lib/schemas/purchaseOrder.schema";
import {
  PartnerType,
  type Partner,
} from "@/types/finance.types";
import type { PaginatedResult } from "@/types/pagination.types";
import type { PurchaseOrder } from "@/types/purchaseOrder.types";
import type { Product, Warehouse } from "@/types/stock.types";
import { PurchaseOrderLineEditor } from "@/components/stock/PurchaseOrderLineEditor";

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();

  const { data: partnersData } = useQuery<{
    partners: PaginatedResult<Partner>;
  }>(GET_PARTNERS_QUERY, {
    variables: { pagination: { skip: 0, take: 200 } },
    fetchPolicy: "cache-first",
  });

  const { data: warehousesData } = useQuery<{
    warehouses: PaginatedResult<Warehouse>;
  }>(GET_WAREHOUSES_QUERY, {
    variables: { pagination: { skip: 0, take: 100 } },
    fetchPolicy: "cache-first",
  });

  const { data: productsData } = useQuery<{
    products: PaginatedResult<Product>;
  }>(GET_PRODUCTS_QUERY, {
    variables: { pagination: { skip: 0, take: 500 } },
    fetchPolicy: "cache-first",
  });

  const suppliers = useMemo(
    () =>
      (partnersData?.partners.items ?? []).filter(
        (p) =>
          p.partnerType === PartnerType.SUPPLIER ||
          p.partnerType === PartnerType.BOTH,
      ),
    [partnersData],
  );
  const warehouses = (warehousesData?.warehouses.items ?? []).filter(
    (w) => w.isActive,
  );
  const products = useMemo(
    () => (productsData?.products.items ?? []).filter((p) => p.isActive),
    [productsData],
  );

  const methods = useForm<CreatePurchaseOrderFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPurchaseOrderSchema) as any,
    defaultValues: {
      supplierId: "",
      warehouseId: "",
      expectedDate: "",
      currency: "RON",
      notes: "",
      lines: [{ productId: "", qtyOrdered: 1, unitCost: 0, notes: "" }],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;

  const [createPurchaseOrder] = useMutationWithToast<{
    createPurchaseOrder: PurchaseOrder;
  }>(CREATE_PURCHASE_ORDER_MUTATION, {
    successMessage: (d) => `${d.createPurchaseOrder.formattedNumber} created`,
    refetchQueries: [{ query: GET_PURCHASE_ORDERS_QUERY }],
  });

  const onSubmit = async (values: CreatePurchaseOrderFormData) => {
    try {
      const res = await createPurchaseOrder({
        variables: {
          input: {
            supplierId: values.supplierId,
            warehouseId: values.warehouseId,
            expectedDate: values.expectedDate
              ? new Date(values.expectedDate).toISOString()
              : undefined,
            currency: values.currency || "RON",
            notes: values.notes || undefined,
            lines: values.lines.map((l) => ({
              productId: l.productId,
              qtyOrdered: Number(l.qtyOrdered),
              unitCost: Number(l.unitCost),
              notes: l.notes || undefined,
            })),
          },
        },
      });
      const created = res.data?.createPurchaseOrder;
      if (created) {
        navigate(`/stock/purchase-orders/${created.id}`);
      }
    } catch {
      // toast already shown
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/stock/purchase-orders")}
            className="gap-2 -ml-2 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to purchase orders
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            New Purchase Order
          </h1>
          <p className="text-slate-600 mt-1">
            Draft an order to send to a supplier.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Header</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <Controller
                    control={control}
                    name="supplierId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="supplierId"
                          className={
                            errors.supplierId ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                              {s.cui ? ` · CUI ${s.cui}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.supplierId && (
                    <p className="text-sm text-red-500">
                      {errors.supplierId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="warehouseId">Delivery warehouse *</Label>
                  <Controller
                    control={control}
                    name="warehouseId"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="warehouseId"
                          className={
                            errors.warehouseId ? "border-red-500" : ""
                          }
                        >
                          <SelectValue placeholder="Select warehouse" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.code} · {w.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.warehouseId && (
                    <p className="text-sm text-red-500">
                      {errors.warehouseId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expectedDate">Expected date</Label>
                  <Input
                    id="expectedDate"
                    type="date"
                    {...register("expectedDate")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    {...register("currency")}
                    placeholder="RON"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Optional remarks…"
                  {...register("notes")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <PurchaseOrderLineEditor products={products} />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/stock/purchase-orders")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Save as draft"}
            </Button>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
