import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ReportTableColumn<T> {
  className?: string;
  header: string;
  render: (row: T) => ReactNode;
}

interface ReportDataTableProps<T> {
  columns: ReportTableColumn<T>[];
  getRowKey: (row: T) => string;
  rows: T[];
}

export function ReportDataTable<T>({
  columns,
  getRowKey,
  rows,
}: ReportDataTableProps<T>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.header} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={getRowKey(row)}>
            {columns.map((column) => (
              <TableCell key={column.header} className={column.className}>
                {column.render(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
