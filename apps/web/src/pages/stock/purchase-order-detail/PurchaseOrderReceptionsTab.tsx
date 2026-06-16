import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatQuantity } from "@/lib/formatters";
import type { PurchaseOrderReceipt } from "@/types/purchaseOrder.types";

interface PurchaseOrderReceptionsTabProps {
  canReceive: boolean;
  receipts: PurchaseOrderReceipt[];
}

export function PurchaseOrderReceptionsTab({
  canReceive,
  receipts,
}: PurchaseOrderReceptionsTabProps) {
  if (receipts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-slate-500">
            No receptions yet.
            {canReceive && " Click \"Record reception\" to log the first NIR."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {receipts.map((receipt) => (
        <Card key={receipt.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="font-mono">
                {receipt.formattedNumber}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Received on {formatDate(receipt.receivedDate)} by{" "}
                {receipt.createdBy
                  ? `${receipt.createdBy.firstName} ${receipt.createdBy.lastName}`
                  : "—"}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.lines.map((line) => {
                  const unit = line.orderLine?.product?.unit ?? "";
                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        {line.orderLine?.product?.sku} ·{" "}
                        {line.orderLine?.product?.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatQuantity(line.qtyReceived, unit)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {receipt.notes && (
              <p className="mt-3 text-xs text-slate-500 whitespace-pre-wrap">
                {receipt.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
