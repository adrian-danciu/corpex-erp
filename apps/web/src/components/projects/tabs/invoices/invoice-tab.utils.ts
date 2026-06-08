import type { InvoiceLineDraft } from "@/types/project.types";

export function dueDateInDays(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function getInvoiceSourceLabel(
  sourceType: InvoiceLineDraft["sourceType"],
): string {
  if (sourceType === "PROJECT_MATERIAL") return "Material";
  if (sourceType === "PROJECT_SERVICE") return "Service";
  return "Vehicle expense";
}
