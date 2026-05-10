import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useAuthStore } from "@/stores/auth.store";
import { canAccess } from "@/lib/permissions";
import { AlertCircle, Pencil, Plus, Search } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  GET_PRODUCTS_QUERY,
  UPDATE_PRODUCT_MUTATION,
} from "@/graphql/mutations/stock.mutations";
import type { PaginatedResult } from "@/types/pagination.types";
import type { Product } from "@/types/stock.types";
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
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [editError, setEditError] = useState("");
  const { page, pageSize, skip, take, setPage } = usePagination();
  const { formatMoney } = useCurrency();

  const { data, loading, error, refetch } = useQuery<{
    products: PaginatedResult<Product>;
  }>(GET_PRODUCTS_QUERY, {
    variables: {
      pagination: { skip, take },
      search: search || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const editForm = useForm<EditProductFormData>();

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
      setEditError("");
    }
  }, [editing, editForm]);

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
              setPage(1);
              setSearch(searchValue.trim());
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2 pr-4">SKU</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4 text-right">Unit price</th>
                    <th className="py-2 pr-4 text-right">Current stock</th>
                    <th className="py-2 pr-4 text-right">Min stock</th>
                    <th className="py-2 pr-4 text-right">Stock value</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className={
                        product.isActive
                          ? "border-b last:border-0"
                          : "border-b last:border-0 opacity-60"
                      }
                    >
                      <td className="py-2 pr-4 font-mono text-xs">{product.sku}</td>
                      <td className="py-2 pr-4 font-medium">
                        {product.name}
                        {!product.isActive && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                            inactive
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{product.category || "-"}</td>
                      <td className="py-2 pr-4 text-right">
                        {formatMoney(product.unitPrice)} / {product.unit}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {product.currentStock.toLocaleString()} {product.unit}
                      </td>
                      <td className="py-2 pr-4 text-right">
                        {product.minimumStock.toLocaleString()} {product.unit}
                      </td>
                      <td className="py-2 pr-4 text-right font-medium">
                        {formatMoney(product.currentStock * product.unitPrice)}
                      </td>
                      <td className="py-2 text-right">
                        {canWrite && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditing(product)}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

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
                    value={editForm.watch("unit") || DEFAULT_UNIT}
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
                  checked={editForm.watch("isActive")}
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
