import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useForm, useWatch } from "react-hook-form";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useAuthStore } from "@/stores/auth.store";
import { canAccess } from "@/lib/permissions";
import { AlertCircle, PackageX, Pencil, Plus, Search } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import {
  GET_PRODUCTS_QUERY,
  UPDATE_PRODUCT_MUTATION,
} from "@/graphql/mutations/stock.mutations";
import { GET_IN_TRANSIT_SUMMARY_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import { DefectiveStockSheet } from "@/components/stock/DefectiveStockSheet";
import type { Product, ProductsQueryResult } from "@/types/stock.types";
import type { InTransitSummaryQueryResult } from "@/types/purchaseOrder.types";
import { useCurrency } from "@/hooks/useCurrency";
import { UNITS, DEFAULT_UNIT } from "@/lib/units";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditProductFormData {
  name: string;
  description: string;
  category: string;
  unit: string;
  minimumStock: number;
  unitPrice: number;
  isActive: boolean;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = canAccess(user, "stock", "write");
  const { getFilter, setFilter } = useUrlFilters();
  const search = getFilter("search");
  const [searchValue, setSearchValue] = useState(search);
  const [editing, setEditing] = useState<Product | null>(null);
  const [defectiveFor, setDefectiveFor] = useState<Product | null>(null);
  const [editError, setEditError] = useState("");
  const { page, pageSize, skip, take, setPage } = usePagination();
  const { formatMoney } = useCurrency();

  const { data, loading, error, refetch } = useQuery<ProductsQueryResult>(
    GET_PRODUCTS_QUERY,
    {
    variables: {
      pagination: { skip, take },
      search: search || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const { data: inTransitData } = useQuery<InTransitSummaryQueryResult>(
    GET_IN_TRANSIT_SUMMARY_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  const inTransitMap = new Map<string, number>(
    (inTransitData?.inTransitSummary ?? []).map((r) => [
      r.productId,
      r.qtyInTransit,
    ]),
  );

  const editForm = useForm<EditProductFormData>();
  const editUnit = useWatch({ control: editForm.control, name: "unit" });
  const editIsActive = useWatch({
    control: editForm.control,
    name: "isActive",
  });

  useEffect(() => {
    if (editing) {
      editForm.reset({
        name: editing.name,
        description: editing.description ?? "",
        category: editing.category ?? "",
        unit: editing.unit,
        minimumStock: editing.minimumStock,
        unitPrice: editing.unitPrice,
        isActive: editing.isActive,
      });
    }
  }, [editing, editForm]);

  const startEditing = (product: Product) => {
    setEditError("");
    setEditing(product);
  };

  const [updateProduct, { loading: saving }] = useMutationWithToast(
    UPDATE_PRODUCT_MUTATION,
    {
      successMessage: "Product updated",
      onCompleted: () => {
        setEditing(null);
        void refetch();
      },
    },
  );

  const submitEdit = async (values: EditProductFormData) => {
    if (!editing) return;
    setEditError("");
    try {
      await updateProduct({
        variables: {
          input: {
            productId: editing.id,
            name: values.name,
            description: values.description || undefined,
            category: values.category || undefined,
            unit: values.unit,
            minimumStock: Number(values.minimumStock) || 0,
            unitPrice: Number(values.unitPrice) || 0,
            isActive: values.isActive,
          },
        },
      });
    } catch {
      // toast already shown
    }
  };

  if (loading) {
    return <PageLoading message="Loading products..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load products</p>
      </div>
    );
  }

  const products = data?.products.items ?? [];
  const totalItems = data?.products.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage stock products and thresholds.</p>
        </div>
        {canWrite && (
          <Button onClick={() => navigate("/stock/products/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setFilter("search", searchValue.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by SKU, name or category"
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {products.length} Product{products.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-slate-500">No products found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Current stock</TableHead>
                  <TableHead className="text-right">In transit</TableHead>
                  <TableHead className="text-right">Min stock</TableHead>
                  <TableHead className="text-right">Stock value</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className={product.isActive ? "" : "opacity-60"}
                  >
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell className="font-medium">
                        {product.name}
                        {!product.isActive && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            inactive
                          </span>
                        )}
                    </TableCell>
                    <TableCell>{product.category || "-"}</TableCell>
                    <TableCell className="text-right">
                        {formatMoney(product.unitPrice)} / {product.unit}
                    </TableCell>
                    <TableCell className="text-right">
                        {product.currentStock.toLocaleString()} {product.unit}
                    </TableCell>
                    <TableCell className="text-right text-amber-700">
                        {(inTransitMap.get(product.id) ?? 0).toLocaleString()}{" "}
                        {product.unit}
                    </TableCell>
                    <TableCell className="text-right">
                        {product.minimumStock.toLocaleString()} {product.unit}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                        {formatMoney(product.currentStock * product.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      {canWrite && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                            onClick={() => setDefectiveFor(product)}
                            aria-label={`Manage defective stock for ${product.name}`}
                            title="Manage defective stock"
                          >
                            <PackageX className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditing(product)}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      {defectiveFor && (
        <DefectiveStockSheet
          product={defectiveFor}
          open={Boolean(defectiveFor)}
          onClose={() => {
            setDefectiveFor(null);
            void refetch();
          }}
        />
      )}

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
      >
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
          {editError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
              {editError}
            </div>
          )}
          {editing && (
            <form
              onSubmit={editForm.handleSubmit(submitEdit)}
              className="space-y-3"
            >
              <div>
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  {...editForm.register("name", { required: true })}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    {...editForm.register("category")}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Select
                    value={editUnit || DEFAULT_UNIT}
                    onValueChange={(v) =>
                      editForm.setValue("unit", v, { shouldDirty: true })
                    }
                  >
                    <SelectTrigger id="edit-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show legacy value (e.g. "ream") if it isn't in the curated list */}
                      {editing &&
                        !UNITS.find((u) => u.value === editing.unit) && (
                          <SelectItem value={editing.unit}>
                            {editing.unit} (legacy)
                          </SelectItem>
                        )}
                      {UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
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
                    {...editForm.register("minimumStock", {
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
                    {...editForm.register("unitPrice", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-desc">Description</Label>
                <Input
                  id="edit-desc"
                  {...editForm.register("description")}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <Checkbox
                  checked={editIsActive}
                  onCheckedChange={(checked) =>
                    editForm.setValue("isActive", checked === true, {
                      shouldDirty: true,
                    })
                  }
                />
                Active (uncheck to discontinue this product)
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
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
    </div>
  );
}
