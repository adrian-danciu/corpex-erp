import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { format } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import {
  APPROVE_PAYROLL_MUTATION,
  DELETE_PAYROLL_PERIOD_MUTATION,
  GENERATE_PAYROLL_MUTATION,
  GET_PAYROLL_PERIOD_QUERY,
  GET_PAYROLL_PERIODS_QUERY,
  MARK_PAYROLL_PAID_MUTATION,
  UPDATE_PAYROLL_LINE_MUTATION,
} from "@/graphql/mutations/payroll.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PayrollLine, PayrollPeriod } from "@/types/payroll.types";
import { PayrollStatus } from "@/types/payroll.types";
import type { ExportColumn } from "@/lib/report-export";

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

function formatMoney(value: number, currency = "EUR") {
  return value.toLocaleString("ro-RO", { style: "currency", currency });
}

function statusClass(status: PayrollStatus) {
  switch (status) {
    case PayrollStatus.DRAFT:
      return "bg-slate-100 text-slate-700";
    case PayrollStatus.APPROVED:
      return "bg-amber-100 text-amber-800";
    case PayrollStatus.PAID:
      return "bg-emerald-100 text-emerald-800";
  }
}

function periodLabel(period: Pick<PayrollPeriod, "month" | "year">) {
  return `${MONTHS[period.month - 1]} ${period.year}`;
}

function employeeTaxTotal(line: PayrollLine) {
  return line.casAmount + line.cassAmount + line.incomeTaxAmount;
}

export default function PayrollPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [notes, setNotes] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [bonus, setBonus] = useState(0);
  const [manualDeductions, setManualDeductions] = useState(0);
  const [lineNotes, setLineNotes] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);

  const {
    data: periodsData,
    loading: periodsLoading,
    error: periodsError,
    refetch: refetchPeriods,
  } = useQuery<{ payrollPeriods: PayrollPeriod[] }>(GET_PAYROLL_PERIODS_QUERY);

  const periods = periodsData?.payrollPeriods ?? [];
  const activePeriodId = selectedPeriodId ?? periods[0]?.id ?? null;

  const {
    data: periodData,
    loading: periodLoading,
    refetch: refetchPeriod,
  } = useQuery<{ payrollPeriod: PayrollPeriod }>(GET_PAYROLL_PERIOD_QUERY, {
    variables: { id: activePeriodId },
    skip: !activePeriodId,
  });

  const activePeriod = periodData?.payrollPeriod;
  const lines = activePeriod?.lines ?? [];

  const [generatePayroll, { loading: generating }] = useMutationWithToast(
    GENERATE_PAYROLL_MUTATION,
    {
      successMessage: "Payroll generated",
      onCompleted: (data: { generatePayroll: PayrollPeriod }) => {
        setSelectedPeriodId(data.generatePayroll.id);
        setNotes("");
        void refetchPeriods();
      },
    },
  );

  const [updateLine, { loading: updatingLine }] = useMutationWithToast(
    UPDATE_PAYROLL_LINE_MUTATION,
    {
      successMessage: "Payroll line updated",
      onCompleted: () => {
        setEditingLineId(null);
        void refetchPeriod();
        void refetchPeriods();
      },
    },
  );

  const [approvePayroll, { loading: approving }] = useMutationWithToast(
    APPROVE_PAYROLL_MUTATION,
    {
      successMessage: "Payroll approved",
      onCompleted: () => {
        void refetchPeriod();
        void refetchPeriods();
      },
    },
  );

  const [markPaid, { loading: paying }] = useMutationWithToast(
    MARK_PAYROLL_PAID_MUTATION,
    {
      successMessage: "Payroll marked as paid",
      onCompleted: () => {
        void refetchPeriod();
        void refetchPeriods();
      },
    },
  );

  const [deletePayrollPeriod, { loading: deletingPeriod }] = useMutationWithToast(
    DELETE_PAYROLL_PERIOD_MUTATION,
    {
      successMessage: "Payroll draft deleted",
      onCompleted: () => {
        void refetchPeriods();
      },
    },
  );

  const payrollExport = useMemo(() => {
    const columns: ExportColumn[] = [
      { header: "Employee", width: 130 },
      { header: "Position", width: 120 },
      { header: "Gross Salary", width: 80 },
      { header: "Bonus", width: 70 },
      { header: "Taxable Gross", width: 80 },
      { header: "CAS", width: 70 },
      { header: "CASS", width: 70 },
      { header: "Income Tax", width: 80 },
      { header: "CAM", width: 70 },
      { header: "Manual Deductions", width: 90 },
      { header: "Unpaid Leave", width: 75 },
      { header: "Net Amount", width: 85 },
      { header: "Employer Cost", width: 90 },
      { header: "Notes", width: 150 },
    ];
    const rows = lines.map((line) => [
      line.employee ? `${line.employee.firstName} ${line.employee.lastName}` : line.employeeId,
      line.employee?.position ?? "",
      String(line.grossSalary),
      String(line.bonus),
      String(line.taxableGross),
      String(line.casAmount),
      String(line.cassAmount),
      String(line.incomeTaxAmount),
      String(line.camAmount),
      String(line.manualDeductions),
      `${line.unpaidLeaveDays} days / ${line.unpaidLeaveDeduction}`,
      String(line.netAmount),
      String(line.employerTotalCost),
      line.notes ?? "",
    ]);
    return {
      title: activePeriod ? `Payroll ${periodLabel(activePeriod)}` : "Payroll",
      filename: activePeriod
        ? `payroll-${activePeriod.year}-${String(activePeriod.month).padStart(2, "0")}`
        : "payroll",
      columns,
      rows,
    };
  }, [activePeriod, lines]);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void generatePayroll({
      variables: {
        input: {
          year,
          month,
          currency: "EUR",
          notes: notes.trim() || undefined,
        },
      },
    });
  };

  const startEdit = (line: PayrollLine) => {
    setEditingLineId(line.id);
    setBonus(line.bonus);
    setManualDeductions(line.manualDeductions);
    setLineNotes(line.notes ?? "");
  };

  const saveLine = () => {
    if (!editingLineId) return;
    void updateLine({
      variables: {
        input: {
          lineId: editingLineId,
          bonus: Number(bonus) || 0,
          manualDeductions: Number(manualDeductions) || 0,
          notes: lineNotes.trim() || undefined,
        },
      },
    });
  };

  const deleteDraft = () => {
    if (!activePeriod || activePeriod.status !== PayrollStatus.DRAFT) return;
    const confirmed = window.confirm(
      `Delete the ${periodLabel(activePeriod)} payroll draft? This cannot be undone.`,
    );
    if (!confirmed) return;

    const nextPeriod = periods.find((period) => period.id !== activePeriod.id);
    setSelectedPeriodId(nextPeriod?.id ?? null);
    void deletePayrollPeriod({ variables: { periodId: activePeriod.id } });
  };

  const runExport = async (formatType: "pdf" | "xlsx") => {
    if (!activePeriod) return;
    const key = `payroll-${formatType}`;
    setExporting(key);
    try {
      const { exportReport } = await import("@/lib/report-export");
      await exportReport(
        formatType,
        payrollExport.filename,
        payrollExport.title,
        payrollExport.columns,
        payrollExport.rows,
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll</h1>
        <p className="mt-2 text-slate-500">
          Generate monthly payroll from gross salaries, calculate Romanian taxes, approve and mark paid.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Generate Payroll
              </CardTitle>
              <CardDescription>Creates a draft payroll for employees with salaries.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleGenerate}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="payroll-month">Month</Label>
                    <Input
                      id="payroll-month"
                      type="number"
                      min={1}
                      max={12}
                      value={month}
                      onChange={(event) => setMonth(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payroll-year">Year</Label>
                    <Input
                      id="payroll-year"
                      type="number"
                      min={2000}
                      max={2100}
                      value={year}
                      onChange={(event) => setYear(Number(event.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payroll-notes">Notes</Label>
                  <Textarea
                    id="payroll-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                    placeholder="Optional payroll context"
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <WalletCards className="h-4 w-4" />}
                  {generating ? "Generating..." : "Generate Draft"}
                </Button>
              </form>
            </CardContent>
          </Card>

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
                <p className="text-sm text-muted-foreground">No payroll periods yet.</p>
              ) : (
                <div className="space-y-2">
                  {periods.map((period) => (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => setSelectedPeriodId(period.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        activePeriodId === period.id ? "border-primary bg-primary/5" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{periodLabel(period)}</span>
                        <Badge className={statusClass(period.status)}>{period.status}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {period.employeeCount} employees · {formatMoney(period.totalNet, period.currency)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                {activePeriod ? periodLabel(activePeriod) : "Payroll Details"}
              </CardTitle>
              <CardDescription>
                {activePeriod
                  ? `${activePeriod.employeeCount} employees · ${activePeriod.status}`
                  : "Select or generate a payroll period."}
              </CardDescription>
            </div>
            {activePeriod && (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lines.length === 0 || exporting === "payroll-pdf"}
                  onClick={() => void runExport("pdf")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {exporting === "payroll-pdf" ? "Generating..." : "PDF"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lines.length === 0 || exporting === "payroll-xlsx"}
                  onClick={() => void runExport("xlsx")}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Excel
                </Button>
                {activePeriod.status === PayrollStatus.DRAFT && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-red-600 hover:text-red-700"
                      disabled={deletingPeriod}
                      onClick={deleteDraft}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingPeriod ? "Deleting..." : "Delete Draft"}
                    </Button>
                    <Button
                      size="sm"
                      className="gap-2"
                      disabled={approving}
                      onClick={() => void approvePayroll({ variables: { periodId: activePeriod.id } })}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                  </>
                )}
                {activePeriod.status === PayrollStatus.APPROVED && (
                  <Button
                    size="sm"
                    className="gap-2"
                    disabled={paying}
                    onClick={() => void markPaid({ variables: { periodId: activePeriod.id } })}
                  >
                    <WalletCards className="h-4 w-4" />
                    Mark Paid
                  </Button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!activePeriodId ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No payroll selected.</p>
            ) : periodLoading ? (
              <div className="flex justify-center py-16">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : !activePeriod ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Payroll period not found.</p>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Gross</p>
                    <p className="font-semibold">{formatMoney(activePeriod.totalGross, activePeriod.currency)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Contract salary before withholding</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Bonus</p>
                    <p className="font-semibold">{formatMoney(activePeriod.totalBonus, activePeriod.currency)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Employee Taxes</p>
                    <p className="font-semibold">
                      {formatMoney(
                        activePeriod.totalCas + activePeriod.totalCass + activePeriod.totalIncomeTax,
                        activePeriod.currency,
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className="font-semibold">{formatMoney(activePeriod.totalNet, activePeriod.currency)}</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="text-xs text-muted-foreground underline decoration-dotted underline-offset-4"
                          >
                            CAM
                          </button>
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
                    <p className="mt-1 text-[11px] text-muted-foreground">Employer contribution</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4">
                    <p className="text-xs text-muted-foreground">Total Employer Cost</p>
                    <p className="font-semibold">{formatMoney(activePeriod.totalEmployerCost, activePeriod.currency)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">Gross + CAM</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Employee Taxes</TableHead>
                      <TableHead>CAM</TableHead>
                      <TableHead>Manual</TableHead>
                      <TableHead>Unpaid</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Employer Cost</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((line) => {
                      const isEditing = editingLineId === line.id;
                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {line.employee
                                  ? `${line.employee.firstName} ${line.employee.lastName}`
                                  : line.employeeId}
                              </p>
                              <p className="text-xs text-muted-foreground">{line.employee?.position}</p>
                            </div>
                          </TableCell>
                          <TableCell>{formatMoney(line.grossSalary, activePeriod.currency)}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                className="h-8 w-24"
                                value={bonus}
                                onChange={(event) => setBonus(Number(event.target.value))}
                              />
                            ) : (
                              formatMoney(line.bonus, activePeriod.currency)
                            )}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button type="button" className="font-medium underline decoration-dotted underline-offset-4">
                                    {formatMoney(employeeTaxTotal(line), activePeriod.currency)}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="space-y-1 text-xs">
                                  {line.employee?.isContractor ? (
                                    <p>B2B contractor: payroll taxes not withheld.</p>
                                  ) : (
                                    <>
                                      <p>CAS: {formatMoney(line.casAmount, activePeriod.currency)}</p>
                                      <p>CASS: {formatMoney(line.cassAmount, activePeriod.currency)}</p>
                                      <p>Income tax: {formatMoney(line.incomeTaxAmount, activePeriod.currency)}</p>
                                    </>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{formatMoney(line.camAmount, activePeriod.currency)}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                type="number"
                                className="h-8 w-24"
                                value={manualDeductions}
                                onChange={(event) => setManualDeductions(Number(event.target.value))}
                              />
                            ) : (
                              formatMoney(line.manualDeductions, activePeriod.currency)
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div>{line.unpaidLeaveDays} days</div>
                            <div>{formatMoney(line.unpaidLeaveDeduction, activePeriod.currency)}</div>
                          </TableCell>
                          <TableCell className="font-medium">{formatMoney(line.netAmount, activePeriod.currency)}</TableCell>
                          <TableCell>{formatMoney(line.employerTotalCost, activePeriod.currency)}</TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                className="h-8 min-w-36"
                                value={lineNotes}
                                onChange={(event) => setLineNotes(event.target.value)}
                              />
                            ) : (
                              <span className="text-muted-foreground">{line.notes ?? "—"}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              {activePeriod.status === PayrollStatus.DRAFT && (
                                isEditing ? (
                                  <>
                                    <Button size="sm" disabled={updatingLine} onClick={saveLine}>
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingLineId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button size="sm" variant="outline" onClick={() => startEdit(line)}>
                                    Edit
                                  </Button>
                                )
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>

                <p className="text-xs text-muted-foreground">
                  Created {format(new Date(activePeriod.createdAt), "dd MMM yyyy")}
                  {activePeriod.approvedAt ? ` · Approved ${format(new Date(activePeriod.approvedAt), "dd MMM yyyy")}` : ""}
                  {activePeriod.paidAt ? ` · Paid ${format(new Date(activePeriod.paidAt), "dd MMM yyyy")}` : ""}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
