import { useMemo, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";
import { Plus, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GET_PROJECT_MATERIALS_QUERY } from "@/graphql/mutations/project.queries";
import {
  ALLOCATE_PROJECT_MATERIAL_MUTATION,
  REMOVE_PROJECT_MATERIAL_MUTATION,
} from "@/graphql/mutations/project.mutations";
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_STOCK_BY_PRODUCT_QUERY,
  GET_WAREHOUSES_QUERY,
} from "@/graphql/mutations/stock.mutations";
import type {
  Project,
  ProjectMaterial,
} from "@/types/project.types";
import type {
  Product,
  ProductStockBreakdown,
  Warehouse,
} from "@/types/stock.types";
import type { PaginatedResult } from "@/types/pagination.types";
import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface Props {
  project: Project;
  isProjectManager: boolean;
}

export function MaterialsTab({ project, isProjectManager }: Props) {
  const { formatMoney } = useCurrency();
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<ProjectMaterial | null>(
    null,
  );
  const [error, setError] = useState("");

  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState<string>("");
  const [notes, setNotes] = useState("");

  const variables = { projectId: project.id };

  const { data, refetch } = useQuery<{
    projectMaterials: ProjectMaterial[];
  }>(GET_PROJECT_MATERIALS_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const { data: productsData } = useQuery<{
    products: PaginatedResult<Product>;
  }>(GET_PRODUCTS_QUERY, {
    variables: { pagination: { skip: 0, take: 200 } },
  });

  const { data: warehousesData } = useQuery<{
    warehouses: PaginatedResult<Warehouse>;
  }>(GET_WAREHOUSES_QUERY, {
    variables: { pagination: { skip: 0, take: 50 } },
  });

  const [
    fetchProductStock,
    { data: stockBreakdownData },
  ] = useLazyQuery<{ productStockByProduct: ProductStockBreakdown[] }>(
    GET_PRODUCT_STOCK_BY_PRODUCT_QUERY,
    { fetchPolicy: "network-only" },
  );

  const onProductChange = (id: string) => {
    setProductId(id);
    setWarehouseId("");
    if (id) fetchProductStock({ variables: { productId: id } });
  };

  const stockByWarehouse = useMemo(() => {
    const map = new Map<string, ProductStockBreakdown>();
    (stockBreakdownData?.productStockByProduct ?? []).forEach((row) => {
      map.set(row.warehouseId, row);
    });
    return map;
  }, [stockBreakdownData]);

  const selectedProduct = useMemo(
    () => productsData?.products.items.find((p) => p.id === productId) ?? null,
    [productsData, productId],
  );

  const quantityNumber = Number(quantity) || 0;
  const estimatedTotal = selectedProduct
    ? quantityNumber * selectedProduct.unitPrice
    : 0;

  const refetchAll = () => refetch();

  const closeDialog = () => {
    setAllocateOpen(false);
    setProductId("");
    setWarehouseId("");
    setQuantity("");
    setNotes("");
    setError("");
  };

  const [allocateMaterial, { loading: allocating }] = useMutation(
    ALLOCATE_PROJECT_MATERIAL_MUTATION,
    {
      onCompleted: () => {
        closeDialog();
        refetchAll();
      },
      onError: (e) => setError(e.message),
    },
  );

  const [removeMaterial, { loading: removing }] = useMutation(
    REMOVE_PROJECT_MATERIAL_MUTATION,
    {
      onCompleted: () => {
        setConfirmRemove(null);
        refetchAll();
      },
      onError: (e) => setError(e.message),
    },
  );

  const materials = data?.projectMaterials ?? [];
  const products = (productsData?.products.items ?? []).filter(
    (p) => p.isActive,
  );
  const warehouses = warehousesData?.warehouses.items ?? [];

  const submitAllocate = () => {
    setError("");
    if (!productId || !warehouseId || quantityNumber <= 0) {
      setError("Pick a product, a warehouse, and a positive quantity");
      return;
    }
    const stock = stockByWarehouse.get(warehouseId);
    const onHand = stock?.quantity ?? 0;
    if (onHand < quantityNumber) {
      setError(
        `Only ${onHand} ${selectedProduct?.unit ?? ""} on hand in ${
          warehouses.find((w) => w.id === warehouseId)?.code ?? "this warehouse"
        }`,
      );
      return;
    }
    allocateMaterial({
      variables: {
        input: {
          projectId: project.id,
          productId,
          warehouseId,
          quantity: quantityNumber,
          notes: notes || undefined,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      {error && !confirmRemove && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Material allocations</CardTitle>
          {isProjectManager && (
            <Button
              size="sm"
              onClick={() => {
                setError("");
                setAllocateOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Allocate material
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <p className="text-sm text-slate-500">
              No materials allocated yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit cost</TableHead>
                  <TableHead className="text-right">Total cost</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="w-10 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map((m) => {
                  const qty = m.issuedQty || m.requestedQty;
                  const unitCost =
                    m.unitCost > 0
                      ? m.unitCost
                      : (m.product?.unitPrice ?? 0);
                  const totalCost = qty * unitCost;
                  const inStock = (m.product?.currentStock ?? 0) > 0;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {m.product?.name ?? m.productId}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {m.product?.sku}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {m.warehouse?.code ?? m.warehouseId}
                      </TableCell>
                      <TableCell className="text-right text-slate-900">
                        {qty.toLocaleString()} {m.product?.unit ?? ""}
                      </TableCell>
                      <TableCell className="text-right text-slate-700">
                        {formatMoney(unitCost)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-900">
                        {formatMoney(totalCost)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent",
                            inStock
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700",
                          )}
                        >
                          {inStock ? "In stock" : "Out of stock"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isProjectManager && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setConfirmRemove(m)}
                            aria-label={`Remove ${m.product?.name ?? "allocation"}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Allocate dialog */}
      <Dialog
        open={allocateOpen}
        onOpenChange={(open) => (open ? setAllocateOpen(true) : closeDialog())}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allocate material</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                {error}
              </div>
            )}
            <div>
              <Label>Product</Label>
              <Select value={productId} onValueChange={onProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProduct && (
                <p className="text-xs text-slate-600 mt-1">
                  Unit price:{" "}
                  <span className="font-medium">
                    {formatMoney(selectedProduct.unitPrice)}
                  </span>{" "}
                  / {selectedProduct.unit}
                </p>
              )}
            </div>
            <div>
              <Label>Warehouse</Label>
              <Select
                value={warehouseId}
                onValueChange={setWarehouseId}
                disabled={!productId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      productId ? "Pick a warehouse" : "Pick a product first"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => {
                    const stock = stockByWarehouse.get(w.id);
                    const onHand = stock?.quantity ?? 0;
                    const value = selectedProduct
                      ? onHand * selectedProduct.unitPrice
                      : 0;
                    return (
                      <SelectItem key={w.id} value={w.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {w.code} — {w.name}
                          </span>
                          {productId && (
                            <span
                              className={
                                onHand > 0
                                  ? "text-xs text-slate-600"
                                  : "text-xs text-red-600"
                              }
                            >
                              Available: {onHand} · Value: {formatMoney(value)}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              {selectedProduct && quantityNumber > 0 && (
                <p className="text-xs text-slate-600 mt-1">
                  Estimated total:{" "}
                  <span className="font-medium">
                    {formatMoney(estimatedTotal)}
                  </span>{" "}
                  ({quantityNumber} × {formatMoney(selectedProduct.unitPrice)})
                </p>
              )}
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={submitAllocate} disabled={allocating}>
                {allocating ? "Allocating..." : "Allocate"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <Dialog
        open={Boolean(confirmRemove)}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove material allocation?</DialogTitle>
          </DialogHeader>
          {confirmRemove && (
            <div className="space-y-3 text-sm">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-red-800 border border-red-200">
                  {error}
                </div>
              )}
              <p className="text-slate-700">
                Removing this allocation will return{" "}
                <span className="font-medium">
                  {confirmRemove.issuedQty}{" "}
                  {confirmRemove.product?.unit ?? ""}
                </span>{" "}
                of <span className="font-medium">{confirmRemove.product?.name}</span> to{" "}
                <span className="font-mono">
                  {confirmRemove.warehouse?.code}
                </span>{" "}
                and remove the cost from the project rollup.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmRemove(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    removeMaterial({
                      variables: {
                        input: {
                          projectId: project.id,
                          projectMaterialId: confirmRemove.id,
                        },
                      },
                    })
                  }
                  disabled={removing}
                >
                  {removing ? "Removing..." : "Remove and return stock"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
