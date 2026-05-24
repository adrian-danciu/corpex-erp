import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PayrollPeriod } from "@/types/payroll.types";
import { formatMoney } from "../utils";

interface PayrollSummaryCardsProps {
  activePeriod: PayrollPeriod;
}

export function PayrollSummaryCards({ activePeriod }: PayrollSummaryCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-muted-foreground">Gross</p>
        <p className="font-semibold">
          {formatMoney(activePeriod.totalGross, activePeriod.currency)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Contract salary before withholding
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-muted-foreground">Bonus</p>
        <p className="font-semibold">
          {formatMoney(activePeriod.totalBonus, activePeriod.currency)}
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-muted-foreground">Employee Taxes</p>
        <p className="font-semibold">
          {formatMoney(
            activePeriod.totalCas +
              activePeriod.totalCass +
              activePeriod.totalIncomeTax,
            activePeriod.currency,
          )}
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-muted-foreground">Net</p>
        <p className="font-semibold">
          {formatMoney(activePeriod.totalNet, activePeriod.currency)}
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs font-normal text-muted-foreground underline decoration-dotted underline-offset-4"
              >
                CAM
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Contribuția Asiguratorie pentru Muncă
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p className="font-semibold">
          {formatMoney(
            activePeriod.totalEmployerCost - activePeriod.totalGross,
            activePeriod.currency,
          )}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Employer contribution
        </p>
      </div>
      <div className="rounded-lg border bg-white p-4">
        <p className="text-xs text-muted-foreground">Total Employer Cost</p>
        <p className="font-semibold">
          {formatMoney(activePeriod.totalEmployerCost, activePeriod.currency)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">Gross + CAM</p>
      </div>
    </div>
  );
}
