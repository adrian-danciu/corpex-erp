import { pdf } from "@react-pdf/renderer";
import * as XLSX from "xlsx";
import { downloadBlob } from "@/lib/download";
import { ReportPdf } from "@/lib/ReportPdf";

export type ExportColumn = {
  header: string;
  width?: number;
};

function exportXlsx(filename: string, sheetName: string, headers: string[], rows: string[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = headers.map((header, index) => ({
    wch: Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0), 10),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}

async function exportPdf(filename: string, title: string, columns: ExportColumn[], rows: string[][]) {
  const blob = await pdf(<ReportPdf title={title} columns={columns} rows={rows} />).toBlob();
  downloadBlob(blob, filename);
}

export function exportReport(
  format: "pdf" | "xlsx",
  filenameBase: string,
  title: string,
  columns: ExportColumn[],
  rows: string[][],
) {
  const headers = columns.map((column) => column.header);
  if (format === "xlsx") {
    exportXlsx(`${filenameBase}.xlsx`, title.slice(0, 31), headers, rows);
    return Promise.resolve();
  }

  return exportPdf(`${filenameBase}.pdf`, title, columns, rows);
}
