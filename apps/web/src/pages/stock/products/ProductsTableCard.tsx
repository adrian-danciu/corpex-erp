import { PackageX, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatQuantity } from "@/lib/formatters";
import type { Product } from "@/types/stock.types";

interface ProductsTableCardProps {
  canWrite: boolean;
  formatMoney: (amount: number, currency?: string) => string;
  inTransitMap: Map<string, number>;
  onEdit: (product: Product) => void;
  onManageDefective: (product: Product) => void;
  products: Product[];
}

export function ProductsTableCard({
  canWrite,
  formatMoney,
  inTransitMap,
  onEdit,
  onManageDefective,
  products,
}: ProductsTableCardProps) {
  return (
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
                  <TableCell className="font-mono text-xs">
                    {product.sku}
                  </TableCell>
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
                    {formatQuantity(product.currentStock, product.unit)}
                  </TableCell>
                  <TableCell className="text-right text-amber-700">
                    {formatQuantity(
                      inTransitMap.get(product.id) ?? 0,
                      product.unit,
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatQuantity(product.minimumStock, product.unit)}
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
                          onClick={() => onManageDefective(product)}
                          aria-label={`Manage defective stock for ${product.name}`}
                          title="Manage defective stock"
                        >
                          <PackageX className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(product)}
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
  );
}
