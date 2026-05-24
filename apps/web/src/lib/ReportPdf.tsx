import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ExportColumn } from "@/lib/report-export.types";

const pdfStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1e293b",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  subtitle: {
    color: "#64748b",
    marginBottom: 18,
  },
  table: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    minHeight: 24,
  },
  headerRow: {
    backgroundColor: "#f1f5f9",
  },
  cell: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  headerCell: {
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

export function ReportPdf({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: ExportColumn[];
  rows: string[][];
}) {
  const generatedAt = new Date().toLocaleString("ro-RO");

  return (
    <Document title={title}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>{title}</Text>
        <Text style={pdfStyles.subtitle}>Generated from Corpex ERP on {generatedAt}</Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.row, pdfStyles.headerRow]} fixed>
            {columns.map((column, index) => (
              <Text
                key={column.header}
                style={[
                  pdfStyles.cell,
                  pdfStyles.headerCell,
                  { width: column.width ?? `${100 / columns.length}%` },
                  index === columns.length - 1 ? { borderRightWidth: 0 } : {},
                ]}
              >
                {column.header}
              </Text>
            ))}
          </View>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={pdfStyles.row} wrap={false}>
              {columns.map((column, colIndex) => (
                <Text
                  key={`${rowIndex}-${column.header}`}
                  style={[
                    pdfStyles.cell,
                    { width: column.width ?? `${100 / columns.length}%` },
                    colIndex === columns.length - 1 ? { borderRightWidth: 0 } : {},
                  ]}
                >
                  {row[colIndex] ?? ""}
                </Text>
              ))}
            </View>
          ))}
        </View>
        <View style={pdfStyles.footer} fixed>
          <Text style={pdfStyles.footerText}>Corpex ERP</Text>
          <Text
            style={pdfStyles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
