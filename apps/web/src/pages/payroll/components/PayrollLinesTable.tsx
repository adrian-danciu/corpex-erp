import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PayrollLine, PayrollPeriod } from "@/types/payroll.types";
import { PayrollStatus } from "@/types/payroll.types";
import { employeeTaxTotal, formatMoney } from "../utils";

interface PayrollLinesTableProps {
  activePeriod: PayrollPeriod;
  bonus: number;
  editingLineId: string | null;
  lineNotes: string;
  lines: PayrollLine[];
  manualDeductions: number;
  saveLine: () => void;
  setBonus: (bonus: number) => void;
  setEditingLineId: (lineId: string | null) => void;
  setLineNotes: (notes: string) => void;
  setManualDeductions: (deductions: number) => void;
  startEdit: (line: PayrollLine) => void;
  updatingLine: boolean;
}

export function PayrollLinesTable({
  activePeriod,
  bonus,
  editingLineId,
  lineNotes,
  lines,
  manualDeductions,
  saveLine,
  setBonus,
  setEditingLineId,
  setLineNotes,
  setManualDeductions,
  startEdit,
  updatingLine,
}: PayrollLinesTableProps) {
  return (
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
                    <p className="text-xs text-muted-foreground">
                      {line.employee?.position}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {formatMoney(line.grossSalary, activePeriod.currency)}
                </TableCell>
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
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto p-0 font-medium underline decoration-dotted underline-offset-4"
                        >
                          {formatMoney(
                            employeeTaxTotal(line),
                            activePeriod.currency,
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="space-y-1 text-xs">
                        {line.employee?.isContractor ? (
                          <p>B2B contractor: payroll taxes not withheld.</p>
                        ) : (
                          <>
                            <p>
                              CAS:{" "}
                              {formatMoney(line.casAmount, activePeriod.currency)}
                            </p>
                            <p>
                              CASS:{" "}
                              {formatMoney(
                                line.cassAmount,
                                activePeriod.currency,
                              )}
                            </p>
                            <p>
                              Income tax:{" "}
                              {formatMoney(
                                line.incomeTaxAmount,
                                activePeriod.currency,
                              )}
                            </p>
                          </>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  {formatMoney(line.camAmount, activePeriod.currency)}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      className="h-8 w-24"
                      value={manualDeductions}
                      onChange={(event) =>
                        setManualDeductions(Number(event.target.value))
                      }
                    />
                  ) : (
                    formatMoney(line.manualDeductions, activePeriod.currency)
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  <div>{line.unpaidLeaveDays} days</div>
                  <div>
                    {formatMoney(
                      line.unpaidLeaveDeduction,
                      activePeriod.currency,
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {formatMoney(line.netAmount, activePeriod.currency)}
                </TableCell>
                <TableCell>
                  {formatMoney(line.employerTotalCost, activePeriod.currency)}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input
                      className="h-8 min-w-36"
                      value={lineNotes}
                      onChange={(event) => setLineNotes(event.target.value)}
                    />
                  ) : (
                    <span className="text-muted-foreground">
                      {line.notes ?? "—"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {activePeriod.status === PayrollStatus.DRAFT &&
                      (isEditing ? (
                        <>
                          <Button
                            size="sm"
                            disabled={updatingLine}
                            onClick={saveLine}
                          >
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(line)}
                        >
                          Edit
                        </Button>
                      ))}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
