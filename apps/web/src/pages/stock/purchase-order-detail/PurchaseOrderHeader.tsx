import {
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Trash2,
  XCircle,
} from "lucide-react";
import { PurchaseOrderStatusBadge } from "@/components/stock/PurchaseOrderStatusBadge";
import { Button } from "@/components/ui/button";
import type { PurchaseOrder } from "@/types/purchaseOrder.types";

interface PurchaseOrderHeaderProps {
  canCancel: boolean;
  canConfirm: boolean;
  canDelete: boolean;
  canReceive: boolean;
  canWrite: boolean;
  confirming: boolean;
  deleting: boolean;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onDelete: () => void;
  onReceive: () => void;
  order: PurchaseOrder;
}

export function PurchaseOrderHeader({
  canCancel,
  canConfirm,
  canDelete,
  canReceive,
  canWrite,
  confirming,
  deleting,
  onBack,
  onCancel,
  onConfirm,
  onDelete,
  onReceive,
  order,
}: PurchaseOrderHeaderProps) {
  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2 mb-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to purchase orders
      </Button>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-slate-900">
              {order.formattedNumber}
            </h1>
            <PurchaseOrderStatusBadge status={order.status} />
          </div>
          <p className="text-slate-600 mt-1">
            {order.supplier?.name ?? "Unknown supplier"} · Delivery to{" "}
            {order.warehouse?.code}
          </p>
        </div>

        {canWrite && (
          <div className="flex items-center gap-2 flex-wrap">
            {canConfirm && (
              <Button
                onClick={onConfirm}
                disabled={confirming}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                {confirming ? "Confirming..." : "Confirm"}
              </Button>
            )}
            {canReceive && (
              <Button onClick={onReceive} className="gap-2">
                <PackagePlus className="h-4 w-4" />
                Record reception
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" onClick={onCancel} className="gap-2">
                <XCircle className="h-4 w-4" />
                Cancel
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                onClick={onDelete}
                disabled={deleting}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
