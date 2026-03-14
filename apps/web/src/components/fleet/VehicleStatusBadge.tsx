import { cn } from "@/lib/utils";
import { VehicleStatus } from "@/types/fleet.types";

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
}

const statusConfig: Record<VehicleStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-700" },
  MAINTENANCE: { label: "Maintenance", className: "bg-yellow-100 text-yellow-700" },
  INACTIVE: { label: "Inactive", className: "bg-gray-100 text-gray-600" },
};

export function VehicleStatusBadge({ status }: VehicleStatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        config.className,
      )}
    >
      {config.label}
    </span>
  );
}
