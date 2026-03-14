import { cn } from "@/lib/utils";
import { DocumentType } from "@/types/fleet.types";

interface DocumentTypeBadgeProps {
  type: DocumentType;
}

export function DocumentTypeBadge({ type }: DocumentTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        "bg-blue-50 text-blue-700",
      )}
    >
      {type}
    </span>
  );
}
