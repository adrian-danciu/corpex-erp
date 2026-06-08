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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Vehicle } from "@/types/fleet.types";
import type { useVehicleDetailController } from "../hooks/useVehicleDetailController";
import { formatDate } from "@/lib/formatters";

type VehicleDetailController = ReturnType<typeof useVehicleDetailController>;

type VehicleMileageTabProps = Pick<
  VehicleDetailController,
  | "addMileageOpen"
  | "createMileage"
  | "deleteMileage"
  | "mileageForm"
  | "setAddMileageOpen"
> & {
  vehicle: Vehicle;
};

export function VehicleMileageTab({
  addMileageOpen,
  createMileage,
  deleteMileage,
  mileageForm,
  setAddMileageOpen,
  vehicle,
}: VehicleMileageTabProps) {
  const mileageLogs = vehicle.mileageLogs ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Mileage Log</CardTitle>
          <Button
            size="sm"
            onClick={() => setAddMileageOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          {mileageLogs.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">
              No mileage entries yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Odometer (km)</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mileageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {formatDate(log.date)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.odometer.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {log.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMileage({ variables: { id: log.id } })}
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

      <Dialog open={addMileageOpen} onOpenChange={setAddMileageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Mileage Entry</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={mileageForm.handleSubmit((data) =>
              createMileage({
                variables: {
                  createMileageLogInput: {
                    vehicleId: vehicle.id,
                    ...data,
                    date: new Date(data.date),
                    odometer: Number(data.odometer),
                  },
                },
              }),
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...mileageForm.register("date")} />
            </div>
            <div className="space-y-2">
              <Label>Odometer (km) *</Label>
              <Input
                type="number"
                {...mileageForm.register("odometer", { valueAsNumber: true })}
                placeholder="e.g. 125000"
              />
              {mileageForm.formState.errors.odometer && (
                <p className="text-xs text-red-600">
                  {mileageForm.formState.errors.odometer.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                {...mileageForm.register("notes")}
                placeholder="Optional notes"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Entry</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddMileageOpen(false)}
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
