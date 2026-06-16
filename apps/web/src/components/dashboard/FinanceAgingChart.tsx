import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";
import type { FinanceAgingRow } from "@/types/report.types";

type FinanceAgingChartProps = {
  barColor: string;
  barName: string;
  emptyLabel: string;
  rows: FinanceAgingRow[];
  title: string;
};

export function FinanceAgingChart({
  barColor,
  barName,
  emptyLabel,
  rows,
  title,
}: FinanceAgingChartProps) {
  return (
    <Card className="w-full min-w-0">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.every((row) => row.amount === 0) ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-slate-400">
            {emptyLabel}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) =>
                  formatCurrency(Number(value), "EUR", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                }
              />
              <Bar
                dataKey="amount"
                fill={barColor}
                radius={[4, 4, 0, 0]}
                name={barName}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        {!rows.every((row) => row.amount === 0) && (
          <div className="mt-3 flex justify-center text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: barColor }}
              />
              {barName}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
