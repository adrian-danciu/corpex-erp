import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types/project.types";

const statusConfig: Record<ProjectStatus, { label: string; className: string }> =
  {
    PLANNING: { label: "Planning", className: "bg-slate-100 text-slate-700" },
    ACTIVE: { label: "Active", className: "bg-green-100 text-green-700" },
    ON_HOLD: { label: "On hold", className: "bg-yellow-100 text-yellow-700" },
    COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
    CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
  };

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("border-transparent", config.className)}>
      {config.label}
    </Badge>
  );
}
