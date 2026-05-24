import { pdf } from "@react-pdf/renderer";
import { downloadBlob } from "@/lib/download";
import { ReportPdf } from "@/lib/ReportPdf";
import type { ExportColumn } from "@/lib/report-export.types";

export async function exportReportPdf(
  filename: string,
  title: string,
  columns: ExportColumn[],
  rows: string[][],
) {
  const blob = await pdf(
    <ReportPdf title={title} columns={columns} rows={rows} />,
  ).toBlob();
  downloadBlob(blob, filename);
}
