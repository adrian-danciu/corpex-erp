import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/formatters";
import type { PurchaseOrder } from "@/types/purchaseOrder.types";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value ?? "—"}</div>
    </div>
  );
}

interface PurchaseOrderSummaryTabProps {
  order: PurchaseOrder;
  totals: {
    ordered: number;
    received: number;
    outstanding: number;
  };
}

export function PurchaseOrderSummaryTab({
  order,
  totals,
}: PurchaseOrderSummaryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Supplier" value={order.supplier?.name} />
          <Field label="Supplier CUI" value={order.supplier?.cui ?? "—"} />
          <Field
            label="Warehouse"
            value={`${order.warehouse?.code} · ${order.warehouse?.name}`}
          />
          <Field label="Currency" value={order.currency} />
          <Field label="Order date" value={formatDate(order.orderDate)} />
          <Field label="Expected date" value={formatDate(order.expectedDate)} />
          <Field
            label="Subtotal"
            value={`${order.subtotal.toFixed(2)} ${order.currency}`}
          />
          <Field label="Total ordered" value={totals.ordered.toFixed(2)} />
          <Field label="Total received" value={totals.received.toFixed(2)} />
          <Field label="Outstanding" value={totals.outstanding.toFixed(2)} />
          <Field
            label="Created by"
            value={
              order.createdBy
                ? `${order.createdBy.firstName} ${order.createdBy.lastName}`
                : "—"
            }
          />
          <Field label="Created" value={formatDateTime(order.createdAt)} />
          {order.cancelledAt && (
            <Field
              label="Cancelled"
              value={formatDateTime(order.cancelledAt)}
            />
          )}
          {order.cancelReason && (
            <Field label="Cancel reason" value={order.cancelReason} />
          )}
        </dl>
        {order.notes && (
          <div className="mt-4 rounded-md border bg-slate-50/60 p-3 text-sm text-slate-700 whitespace-pre-wrap">
            {order.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
