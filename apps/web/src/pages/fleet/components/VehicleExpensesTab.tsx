import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ExpenseTypeEnum,
  type CreateVehicleExpenseFormData,
} from "@/lib/schemas/fleet.schema";
import type { Project } from "@/types/project.types";
import type { Vehicle } from "@/types/fleet.types";
import type { useVehicleDetailController } from "../hooks/useVehicleDetailController";

type VehicleDetailController = ReturnType<typeof useVehicleDetailController>;

type VehicleExpensesTabProps = Pick<
  VehicleDetailController,
  | "addExpenseOpen"
  | "createExpense"
  | "deleteExpense"
  | "expenseForm"
  | "expenseProjectId"
  | "handleExpenseOpenChange"
  | "setAddExpenseOpen"
  | "setExpenseProjectId"
> & {
  currentProject: Pick<Project, "id" | "code" | "name"> | null;
  projectsList: Project[];
  totalExpenses: number;
  vehicle: Vehicle;
};

export function VehicleExpensesTab({
  addExpenseOpen,
  createExpense,
  currentProject,
  deleteExpense,
  expenseForm,
  expenseProjectId,
  handleExpenseOpenChange,
  projectsList,
  setAddExpenseOpen,
  setExpenseProjectId,
  totalExpenses,
  vehicle,
}: VehicleExpensesTabProps) {
  const expenses = vehicle.expenses ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Expenses
            {expenses.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                Total:{" "}
                {totalExpenses.toLocaleString("ro-RO", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            )}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => handleExpenseOpenChange(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Expense
          </Button>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">
              No expenses recorded.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString("ro-RO")}
                    </TableCell>
                    <TableCell className="capitalize">
                      {expense.type.toLowerCase()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {expense.amount.toLocaleString("ro-RO", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {expense.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          deleteExpense({ variables: { id: expense.id } })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addExpenseOpen} onOpenChange={handleExpenseOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={expenseForm.handleSubmit((data) =>
              createExpense({
                variables: {
                  createVehicleExpenseInput: {
                    vehicleId: vehicle.id,
                    ...data,
                    date: new Date(data.date),
                    amount: Number(data.amount),
                    projectId: expenseProjectId || undefined,
                  },
                },
              }),
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                onValueChange={(v) =>
                  expenseForm.setValue(
                    "type",
                    v as CreateVehicleExpenseFormData["type"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ExpenseTypeEnum).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (EUR) *</Label>
              <Input
                type="number"
                step="0.01"
                {...expenseForm.register("amount", { valueAsNumber: true })}
              />
              {expenseForm.formState.errors.amount && (
                <p className="text-xs text-red-600">
                  {expenseForm.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...expenseForm.register("date")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                {...expenseForm.register("description")}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Project (optional)</Label>
              <Select
                value={expenseProjectId || "__none__"}
                onValueChange={(value) =>
                  setExpenseProjectId(value === "__none__" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No project</SelectItem>
                  {projectsList.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.code} — {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentProject && (
                <p className="text-xs text-slate-500">
                  Defaults to {currentProject.code} (currently active on this
                  vehicle).
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Expense</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddExpenseOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
