import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Spinner } from "@/components/ui/spinner";
import { PayrollActions } from "./components/PayrollActions";
import { PayrollGenerateCard } from "./components/PayrollGenerateCard";
import { PayrollLinesTable } from "./components/PayrollLinesTable";
import { PayrollPeriodList } from "./components/PayrollPeriodList";
import { PayrollSummaryCards } from "./components/PayrollSummaryCards";
import { usePayrollController } from "./hooks/usePayrollController";
import { periodLabel } from "./utils";

export default function PayrollPage() {
  const {
    activePeriod,
    activePeriodId,
    approving,
    bonus,
    confirmDeleteDraft,
    deleteDraftDialogOpen,
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
    setDeleteDraftDialogOpen,
    setEditingLineId,
    setLineNotes,
    setManualDeductions,
    setMonth,
    setNotes,
    setSelectedPeriodId,
    setYear,
    startEdit,
    updatingLine,
    approvePayroll,
    year,
  } = usePayrollController();

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
          <PayrollGenerateCard
            generating={generating}
            handleGenerate={handleGenerate}
            month={month}
            notes={notes}
            setMonth={setMonth}
            setNotes={setNotes}
            setYear={setYear}
            year={year}
          />
          <PayrollPeriodList
            activePeriodId={activePeriodId}
            periods={periods}
            periodsError={periodsError}
            periodsLoading={periodsLoading}
            setSelectedPeriodId={setSelectedPeriodId}
          />
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
              <PayrollActions
                activePeriod={activePeriod}
                approving={approving}
                approvePayroll={approvePayroll}
                deletingPeriod={deletingPeriod}
                exporting={exporting}
                lineCount={lines.length}
                markPaid={markPaid}
                paying={paying}
                runExport={runExport}
                setDeleteDraftDialogOpen={setDeleteDraftDialogOpen}
              />
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
                <PayrollSummaryCards activePeriod={activePeriod} />
                <PayrollLinesTable
                  activePeriod={activePeriod}
                  bonus={bonus}
                  editingLineId={editingLineId}
                  lineNotes={lineNotes}
                  lines={lines}
                  manualDeductions={manualDeductions}
                  saveLine={saveLine}
                  setBonus={setBonus}
                  setEditingLineId={setEditingLineId}
                  setLineNotes={setLineNotes}
                  setManualDeductions={setManualDeductions}
                  startEdit={startEdit}
                  updatingLine={updatingLine}
                />

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
      <ConfirmationDialog
        open={deleteDraftDialogOpen}
        onOpenChange={setDeleteDraftDialogOpen}
        title="Delete payroll draft?"
        description={
          activePeriod
            ? `This permanently deletes the ${periodLabel(activePeriod)} payroll draft. This action cannot be undone.`
            : "This payroll draft will be permanently deleted."
        }
        confirmLabel="Delete draft"
        loading={deletingPeriod}
        onConfirm={confirmDeleteDraft}
      />
    </div>
  );
}
