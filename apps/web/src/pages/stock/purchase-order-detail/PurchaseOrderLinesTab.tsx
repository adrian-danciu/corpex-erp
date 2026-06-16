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
import type { PurchaseOrderLine } from "@/types/purchaseOrder.types";

interface PurchaseOrderLinesTabProps {
  lines: PurchaseOrderLine[];
}

export function PurchaseOrderLinesTab({ lines }: PurchaseOrderLinesTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line items</CardTitle>
      </CardHeader>
      <CardContent>
        {lines.length === 0 ? (
          <p className="text-sm text-slate-500">No line items.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line) => {
                const unit = line.product?.unit ?? "";
                return (
                  <TableRow key={line.id}>
                    <TableCell>
                      <div className="font-medium">
                        {line.product?.sku} · {line.product?.name}
                      </div>
                      {line.notes && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {line.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQuantity(line.qtyOrdered, unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQuantity(line.qtyReceived, unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQuantity(line.qtyOutstanding, unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {line.unitCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {(line.qtyOrdered * line.unitCost).toFixed(2)}
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
