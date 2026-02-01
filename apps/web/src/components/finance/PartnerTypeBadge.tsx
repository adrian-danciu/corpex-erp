import { Badge } from "@/components/ui/badge";
import { PartnerType } from "@/types/finance.types";

const typeConfig: Record<PartnerType, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [PartnerType.CLIENT]: { label: "Client", variant: "default" },
  [PartnerType.SUPPLIER]: { label: "Supplier", variant: "secondary" },
  [PartnerType.BOTH]: { label: "Client & Supplier", variant: "outline" },
};

interface PartnerTypeBadgeProps {
  type: PartnerType;
}

export default function PartnerTypeBadge({ type }: PartnerTypeBadgeProps) {
  const config = typeConfig[type];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
