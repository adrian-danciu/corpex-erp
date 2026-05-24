import * as XLSX from "xlsx";

export function exportReportXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: string[][],
) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = headers.map((header, index) => ({
    wch: Math.max(
      header.length,
      ...rows.map((row) => row[index]?.length ?? 0),
      10,
    ),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename);
}
