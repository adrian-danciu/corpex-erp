import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProjectMaterial } from "@/types/project.types";
import { cn } from "@/lib/utils";

interface MaterialsTableProps {
  formatMoney: (value: number, currency?: string) => string;
  isProjectManager: boolean;
  materials: ProjectMaterial[];
  onAllocate: () => void;
  onRemove: (material: ProjectMaterial) => void;
}

export function MaterialsTable({
  formatMoney,
  isProjectManager,
  materials,
  onAllocate,
  onRemove,
}: MaterialsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Material allocations</CardTitle>
        {isProjectManager && (
          <Button size="sm" onClick={onAllocate} className="gap-2">
            <Plus className="h-4 w-4" />
            Allocate material
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {materials.length === 0 ? (
          <p className="text-sm text-slate-500">No materials allocated yet.</p>
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
              {materials.map((material) => {
                const qty = material.issuedQty || material.requestedQty;
                const unitCost =
                  material.unitCost > 0
                    ? material.unitCost
                    : (material.product?.unitPrice ?? 0);
                const totalCost = qty * unitCost;
                const inStock = (material.product?.currentStock ?? 0) > 0;
                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {material.product?.name ?? material.productId}
                      </div>
                      <div className="font-mono text-xs text-slate-500">
                        {material.product?.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {material.warehouse?.code ?? material.warehouseId}
                    </TableCell>
                    <TableCell className="text-right text-slate-900">
                      {qty.toLocaleString()} {material.product?.unit ?? ""}
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
                          onClick={() => onRemove(material)}
                          aria-label={`Remove ${material.product?.name ?? "allocation"}`}
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
  );
}
