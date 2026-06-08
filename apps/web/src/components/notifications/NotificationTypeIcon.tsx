import {
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  ClipboardCheck,
  CarFront,
  PackageMinus,
  Bell,
  FileWarning,
  ReceiptText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NotificationType } from "@/types/notifications.types";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<NotificationType, LucideIcon> = {
  LEAVE_REQUEST_SUBMITTED: CalendarPlus,
  LEAVE_REQUEST_APPROVED: CalendarCheck,
  LEAVE_REQUEST_REJECTED: CalendarX,
  PROJECT_TASK_ASSIGNED: ClipboardCheck,
  FLEET_DOCUMENT_EXPIRING: CarFront,
  EMPLOYEE_DOCUMENT_EXPIRING: FileWarning,
  STOCK_BELOW_MINIMUM: PackageMinus,
  INVOICE_OVERDUE: ReceiptText,
};

const COLOR_MAP: Record<NotificationType, string> = {
  LEAVE_REQUEST_SUBMITTED: "text-blue-600 bg-blue-50",
  LEAVE_REQUEST_APPROVED: "text-emerald-600 bg-emerald-50",
  LEAVE_REQUEST_REJECTED: "text-rose-600 bg-rose-50",
  PROJECT_TASK_ASSIGNED: "text-violet-600 bg-violet-50",
  FLEET_DOCUMENT_EXPIRING: "text-amber-600 bg-amber-50",
  EMPLOYEE_DOCUMENT_EXPIRING: "text-amber-600 bg-amber-50",
  STOCK_BELOW_MINIMUM: "text-orange-600 bg-orange-50",
  INVOICE_OVERDUE: "text-red-600 bg-red-50",
};

interface NotificationTypeIconProps {
  type: NotificationType;
  className?: string;
}

export function NotificationTypeIcon({
  type,
  className,
}: NotificationTypeIconProps) {
  const Icon = ICON_MAP[type] ?? Bell;
  const colors = COLOR_MAP[type] ?? "text-slate-600 bg-slate-100";
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
        colors,
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}
