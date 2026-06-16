import { InlineError } from "@/components/common/InlineError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { FinanceAgingRow } from "@/types/report.types";
import { ReportDataTable } from "./ReportDataTable";
import { formatCurrency } from "@/lib/formatters";

type FinanceAgingReportCardProps = {
  description: string;
  emptyLabel: string;
  error: boolean;
  errorLabel: string;
  loading: boolean;
  rows: FinanceAgingRow[];
  title: string;
};

export function FinanceAgingReportCard({
  description,
  emptyLabel,
  error,
  errorLabel,
  loading,
  rows,
  title,
}: FinanceAgingReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="size-5 text-primary" />
          </div>
        ) : error ? (
          <InlineError>{errorLabel}</InlineError>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ReportDataTable
            rows={rows}
            getRowKey={(row) => row.label}
            columns={[
              {
                header: "Aging Bucket (days)",
                className: "font-medium",
                render: (row) => row.label,
              },
              {
                header: "Outstanding Amount (EUR)",
                className: "text-right",
                render: (row) => formatCurrency(row.amount),
              },
              {
                header: "Invoice Count",
                className: "text-right",
                render: (row) => row.invoiceCount,
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
