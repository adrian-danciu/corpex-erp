import { type FormEvent, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
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
import { useDisclosure } from "@/hooks/useDisclosure";
import type { ExportColumn } from "@/lib/report-export.types";
import type { PayrollLine, PayrollPeriod } from "@/types/payroll.types";
import { PayrollStatus } from "@/types/payroll.types";

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

function periodLabel(period: Pick<PayrollPeriod, "month" | "year">) {
  return `${MONTHS[period.month - 1]} ${period.year}`;
}

export function usePayrollController() {
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
  const deleteDraftDialog = useDisclosure();

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
  const lines = useMemo(() => activePeriod?.lines ?? [], [activePeriod?.lines]);

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

  const [deletePayrollPeriod, { loading: deletingPeriod }] =
    useMutationWithToast(DELETE_PAYROLL_PERIOD_MUTATION, {
      successMessage: "Payroll draft deleted",
      onCompleted: () => {
        void refetchPeriods();
      },
    });

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
      line.employee
        ? `${line.employee.firstName} ${line.employee.lastName}`
        : line.employeeId,
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
        ? `payroll-${activePeriod.year}-${String(activePeriod.month).padStart(
            2,
            "0",
          )}`
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

  const confirmDeleteDraft = () => {
    if (!activePeriod || activePeriod.status !== PayrollStatus.DRAFT) return;
    const nextPeriod = periods.find((period) => period.id !== activePeriod.id);
    setSelectedPeriodId(nextPeriod?.id ?? null);
    void deletePayrollPeriod({ variables: { periodId: activePeriod.id } });
    deleteDraftDialog.close();
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

  return {
    activePeriod,
    activePeriodId,
    approving,
    bonus,
    confirmDeleteDraft,
    deleteDraftDialogOpen: deleteDraftDialog.open,
    deletingPeriod,
    editingLineId,
    exporting,
    generating,
    handleGenerate,
    lineNotes,
    lines,
    manualDeductions,
    markPaid,
    month,
    notes,
    paying,
    periodLoading,
    periods,
    periodsError,
    periodsLoading,
    runExport,
    saveLine,
    setBonus,
    setDeleteDraftDialogOpen: deleteDraftDialog.setOpen,
    setEditingLineId,
    setLineNotes,
    setManualDeductions,
    setMonth,
    setNotes,
    setSelectedPeriodId,
    setYear,
    startEdit,
    updateLine,
    updatingLine,
    approvePayroll,
    year,
  };
}
