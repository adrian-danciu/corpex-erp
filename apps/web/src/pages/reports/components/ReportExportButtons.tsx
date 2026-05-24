import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ExportColumn } from "@/lib/report-export";

export interface ReportExportDefinition {
  filename: string;
  title: string;
  columns: ExportColumn[];
  rows: string[][];
}

interface ReportExportButtonsProps {
  disabled: boolean;
  exporting: string | null;
  report: ReportExportDefinition;
  runExport: (
    format: "pdf" | "xlsx",
    report: ReportExportDefinition,
  ) => Promise<void>;
}

export function ReportExportButtons({
  disabled,
  exporting,
  report,
  runExport,
}: ReportExportButtonsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || exporting === `${report.filename}-pdf`}
        onClick={() => void runExport("pdf", report)}
      >
        <FileText className="mr-2 h-4 w-4" />
        {exporting === `${report.filename}-pdf` ? "Generating..." : "PDF"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || exporting === `${report.filename}-xlsx`}
        onClick={() => void runExport("xlsx", report)}
      >
        <FileSpreadsheet className="mr-2 h-4 w-4" />
        Excel
      </Button>
    </div>
  );
}
