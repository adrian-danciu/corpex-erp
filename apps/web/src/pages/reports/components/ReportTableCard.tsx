import type { ReactNode } from "react";
import { InlineError } from "@/components/common/InlineError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  ReportDataTable,
  type ReportTableColumn,
} from "./ReportDataTable";

type ReportTableCardProps<T> = {
  actions?: ReactNode;
  columns: ReportTableColumn<T>[];
  description: string;
  emptyLabel: string;
  error: boolean;
  errorLabel: string;
  getRowKey: (row: T) => string;
  loading: boolean;
  rows: T[];
  title: string;
};

export function ReportTableCard<T>({
  actions,
  columns,
  description,
  emptyLabel,
  error,
  errorLabel,
  getRowKey,
  loading,
  rows,
  title,
}: ReportTableCardProps<T>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions}
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
            getRowKey={getRowKey}
            columns={columns}
          />
        )}
      </CardContent>
    </Card>
  );
}
