import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PurchaseOrderStatus } from "@/types/purchaseOrder.types";

const statusConfig: Record<
  PurchaseOrderStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700" },
  ORDERED: { label: "Ordered", className: "bg-amber-100 text-amber-800" },
  PARTIALLY_RECEIVED: {
    label: "Partially received",
    className: "bg-blue-100 text-blue-700",
  },
  FULLY_RECEIVED: {
    label: "Fully received",
    className: "bg-emerald-100 text-emerald-700",
  },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export function PurchaseOrderStatusBadge({
  status,
}: {
  status: PurchaseOrderStatus;
}) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", config.className)}
    >
      {config.label}
    </Badge>
  );
}
