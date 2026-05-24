import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { PayrollPeriod } from "@/types/payroll.types";
import { formatMoney, periodLabel, statusClass } from "../utils";

interface PayrollPeriodListProps {
  activePeriodId: string | null;
  periods: PayrollPeriod[];
  periodsError: unknown;
  periodsLoading: boolean;
  setSelectedPeriodId: (periodId: string) => void;
}

export function PayrollPeriodList({
  activePeriodId,
  periods,
  periodsError,
  periodsLoading,
  setSelectedPeriodId,
}: PayrollPeriodListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payroll Periods</CardTitle>
      </CardHeader>
      <CardContent>
        {periodsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-5 text-primary" />
          </div>
        ) : periodsError ? (
          <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            <span>Failed to load periods.</span>
          </div>
        ) : periods.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No payroll periods yet.
          </p>
        ) : (
          <div className="space-y-2">
            {periods.map((period) => (
              <Button
                key={period.id}
                type="button"
                variant="outline"
                onClick={() => setSelectedPeriodId(period.id)}
                className={`h-auto w-full justify-start px-3 py-2 text-left ${
                  activePeriodId === period.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="w-full">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{periodLabel(period)}</span>
                    <Badge className={statusClass(period.status)}>
                      {period.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {period.employeeCount} employees ·{" "}
                    {formatMoney(period.totalNet, period.currency)}
                  </p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
