export type { ExportColumn } from "@/lib/report-export.types";
import type { ExportColumn } from "@/lib/report-export.types";

export async function exportReport(
  format: "pdf" | "xlsx",
  filenameBase: string,
  title: string,
  columns: ExportColumn[],
  rows: string[][],
) {
  const headers = columns.map((column) => column.header);
  if (format === "xlsx") {
    const { exportReportXlsx } = await import("@/lib/report-export-xlsx");
    exportReportXlsx(`${filenameBase}.xlsx`, title.slice(0, 31), headers, rows);
    return;
  }

  const { exportReportPdf } = await import("@/lib/report-export-pdf");
  await exportReportPdf(`${filenameBase}.pdf`, title, columns, rows);
}
