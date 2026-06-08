import type { PayrollLine, PayrollPeriod } from "@/types/payroll.types";
import { PayrollStatus } from "@/types/payroll.types";
export { formatCurrency as formatMoney } from "@/lib/formatters";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function statusClass(status: PayrollStatus) {
  switch (status) {
    case PayrollStatus.DRAFT:
      return "bg-slate-100 text-slate-700";
    case PayrollStatus.APPROVED:
      return "bg-amber-100 text-amber-800";
    case PayrollStatus.PAID:
      return "bg-emerald-100 text-emerald-800";
  }
}

export function periodLabel(period: Pick<PayrollPeriod, "month" | "year">) {
  return `${MONTHS[period.month - 1]} ${period.year}`;
}

export function employeeTaxTotal(line: PayrollLine) {
  return line.casAmount + line.cassAmount + line.incomeTaxAmount;
}
