import { Badge } from "@/components/ui/badge";
import { InvoiceStatus } from "@/types/finance.types";

const statusConfig: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [InvoiceStatus.DRAFT]: { label: "Draft", variant: "secondary" },
  [InvoiceStatus.SENT]: { label: "Sent", variant: "outline" },
  [InvoiceStatus.PAID]: { label: "Paid", variant: "default" },
  [InvoiceStatus.PARTIALLY_PAID]: { label: "Partially Paid", variant: "outline" },
  [InvoiceStatus.OVERDUE]: { label: "Overdue", variant: "destructive" },
  [InvoiceStatus.CANCELLED]: { label: "Cancelled", variant: "secondary" },
};

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

export default function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
