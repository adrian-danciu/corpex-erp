import { InlineError } from "@/components/common/InlineError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import type { PayrollPeriod } from "@/types/payroll.types";
import { formatMoney, periodLabel, statusClass } from "../utils";

interface PayrollPeriodListProps {
  activePeriodId: string | null;
  embedded?: boolean;
  periods: PayrollPeriod[];
  periodsError: unknown;
  periodsLoading: boolean;
  setSelectedPeriodId: (periodId: string) => void;
}

export function PayrollPeriodList({
  activePeriodId,
  embedded = false,
  periods,
  periodsError,
  periodsLoading,
  setSelectedPeriodId,
}: PayrollPeriodListProps) {
  const content = (
    <div className="min-w-0 space-y-4">
      <CardTitle>Payroll Periods</CardTitle>
      {periodsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="size-5 text-primary" />
        </div>
      ) : periodsError ? (
        <InlineError className="px-3 py-2">Failed to load periods.</InlineError>
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
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card>
      <CardContent className="pt-6">{content}</CardContent>
    </Card>
  );
}
