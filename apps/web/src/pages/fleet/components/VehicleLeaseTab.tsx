import { Pencil, Plus, Trash2 } from "lucide-react";
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

type VehicleDetailController = ReturnType<typeof useVehicleDetailController>;

type VehicleLeaseTabProps = Pick<
  VehicleDetailController,
  | "addLeaseForm"
  | "addLeaseOpen"
  | "createLease"
  | "deleteLease"
  | "editLeaseForm"
  | "editLeaseOpen"
  | "openEditLease"
  | "setAddLeaseOpen"
  | "setEditLeaseOpen"
  | "updateLease"
> & {
  vehicle: Vehicle;
};

export function VehicleLeaseTab({
  addLeaseForm,
  addLeaseOpen,
  createLease,
  deleteLease,
  editLeaseForm,
  editLeaseOpen,
  openEditLease,
  setAddLeaseOpen,
  setEditLeaseOpen,
  updateLease,
  vehicle,
}: VehicleLeaseTabProps) {
  const leases = vehicle.leases ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lease Contracts</CardTitle>
          <Button
            size="sm"
            onClick={() => setAddLeaseOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Lease
          </Button>
        </CardHeader>
        <CardContent>
          {leases.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">
              No lease contracts added.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Monthly Rate</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leases.map((lease) => (
                  <TableRow key={lease.id}>
                    <TableCell className="font-medium">
                      {lease.provider}
                    </TableCell>
                    <TableCell>
                      {new Date(lease.startDate).toLocaleDateString("ro-RO")}
                    </TableCell>
                    <TableCell>
                      {new Date(lease.endDate).toLocaleDateString("ro-RO")}
                    </TableCell>
                    <TableCell>
                      {lease.monthlyRate.toLocaleString("ro-RO", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {lease.notes ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditLease(lease)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            deleteLease({ variables: { id: lease.id } })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addLeaseOpen} onOpenChange={setAddLeaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lease Contract</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addLeaseForm.handleSubmit((data) =>
              createLease({
                variables: {
                  createVehicleLeaseInput: {
                    vehicleId: vehicle.id,
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    monthlyRate: Number(data.monthlyRate),
                  },
                },
              }),
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Provider *</Label>
              <Input
                {...addLeaseForm.register("provider")}
                placeholder="e.g. BCR Leasing"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" {...addLeaseForm.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" {...addLeaseForm.register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (EUR) *</Label>
              <Input
                type="number"
                step="0.01"
                {...addLeaseForm.register("monthlyRate", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...addLeaseForm.register("notes")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Lease</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddLeaseOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLeaseOpen} onOpenChange={() => setEditLeaseOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lease Contract</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editLeaseForm.handleSubmit((data) =>
              updateLease({
                variables: {
                  updateVehicleLeaseInput: {
                    id: editLeaseOpen!.id,
                    ...data,
                    startDate: data.startDate
                      ? new Date(data.startDate)
                      : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    monthlyRate: data.monthlyRate
                      ? Number(data.monthlyRate)
                      : undefined,
                  },
                },
              }),
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input {...editLeaseForm.register("provider")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" {...editLeaseForm.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" {...editLeaseForm.register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (EUR)</Label>
              <Input
                type="number"
                step="0.01"
                {...editLeaseForm.register("monthlyRate", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...editLeaseForm.register("notes")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditLeaseOpen(null)}
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
