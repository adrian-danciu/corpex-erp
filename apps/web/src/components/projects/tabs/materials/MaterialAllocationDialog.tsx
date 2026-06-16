import type { NavigateFunction } from "react-router-dom";
import { InlineError } from "@/components/common/InlineError";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/types/project.types";
import type { Product, ProductStockBreakdown, Warehouse } from "@/types/stock.types";

interface PurchaseDraft {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
}

interface MaterialAllocationDialogProps {
  allocating: boolean;
  estimatedTotal: number;
  error: string;
  formatMoney: (value: number, currency?: string) => string;
  navigate: NavigateFunction;
  notes: string;
  onClose: () => void;
  onOpen: () => void;
  onProductChange: (productId: string) => void;
  onSubmit: () => void;
  open: boolean;
  productId: string;
  products: Product[];
  project: Project;
  purchaseDraft: PurchaseDraft | null;
  quantity: string;
  quantityNumber: number;
  selectedProduct: Product | null;
  setNotes: (notes: string) => void;
  setQuantity: (quantity: string) => void;
  setWarehouseId: (warehouseId: string) => void;
  stockByWarehouse: Map<string, ProductStockBreakdown>;
  warehouseId: string;
  warehouses: Warehouse[];
}

export function MaterialAllocationDialog({
  allocating,
  estimatedTotal,
  error,
  formatMoney,
  navigate,
  notes,
  onClose,
  onOpen,
  onProductChange,
  onSubmit,
  open,
  productId,
  products,
  project,
  purchaseDraft,
  quantity,
  quantityNumber,
  selectedProduct,
  setNotes,
  setQuantity,
  setWarehouseId,
  stockByWarehouse,
  warehouseId,
  warehouses,
}: MaterialAllocationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpen() : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Allocate material</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error && (
            <InlineError
              className="flex-col items-start p-3 text-red-800"
              icon={false}
            >
              <p>{error}</p>
              {purchaseDraft && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams({
                      productId: purchaseDraft.productId,
                      warehouseId: purchaseDraft.warehouseId,
                      qty: String(purchaseDraft.quantity),
                      unitCost: String(purchaseDraft.unitCost),
                      fromProject: project.code,
                    });
                    navigate(`/stock/purchase-orders/new?${params.toString()}`);
                  }}
                >
                  Create purchase order draft
                </Button>
              )}
            </InlineError>
          )}
          <div>
            <Label>Product</Label>
            <Select value={productId} onValueChange={onProductChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <p className="mt-1 text-xs text-slate-600">
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
                  placeholder={productId ? "Pick a warehouse" : "Pick a product first"}
                />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => {
                  const stock = stockByWarehouse.get(warehouse.id);
                  const onHand = stock?.quantity ?? 0;
                  const value = selectedProduct
                    ? onHand * selectedProduct.unitPrice
                    : 0;
                  return (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {warehouse.code} — {warehouse.name}
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
              onChange={(event) => setQuantity(event.target.value)}
            />
            {selectedProduct && quantityNumber > 0 && (
              <p className="mt-1 text-xs text-slate-600">
                Estimated total:{" "}
                <span className="font-medium">{formatMoney(estimatedTotal)}</span>{" "}
                ({quantityNumber} × {formatMoney(selectedProduct.unitPrice)})
              </p>
            )}
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={allocating}>
              {allocating ? "Allocating..." : "Allocate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
