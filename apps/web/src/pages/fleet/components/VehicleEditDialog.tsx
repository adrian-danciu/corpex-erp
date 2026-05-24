import { Button } from "@/components/ui/button";
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
  FuelTypeEnum,
  VehicleStatusEnum,
  type UpdateVehicleFormData,
} from "@/lib/schemas/fleet.schema";
import type { Vehicle } from "@/types/fleet.types";
import type { useVehicleDetailController } from "../hooks/useVehicleDetailController";

type VehicleDetailController = ReturnType<typeof useVehicleDetailController>;

type VehicleEditDialogProps = Pick<
  VehicleDetailController,
  "editVehicleForm" | "editVehicleOpen" | "setEditVehicleOpen" | "updateVehicle"
> & {
  vehicle: Vehicle;
};

export function VehicleEditDialog({
  editVehicleForm,
  editVehicleOpen,
  setEditVehicleOpen,
  updateVehicle,
  vehicle,
}: VehicleEditDialogProps) {
  return (
    <Dialog open={editVehicleOpen} onOpenChange={setEditVehicleOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={editVehicleForm.handleSubmit((data) =>
            updateVehicle({
              variables: { updateVehicleInput: { id: vehicle.id, ...data } },
            }),
          )}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {(["plateNumber", "chassisNumber", "brand", "model"] as const).map(
              (field) => (
                <div key={field} className="space-y-2">
                  <Label>
                    {field
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (value) => value.toUpperCase())}
                  </Label>
                  <Input {...editVehicleForm.register(field)} />
                </div>
              ),
            )}
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                {...editVehicleForm.register("year", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select
                defaultValue={vehicle.fuelType}
                onValueChange={(value) =>
                  editVehicleForm.setValue(
                    "fuelType",
                    value as UpdateVehicleFormData["fuelType"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FuelTypeEnum).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0) + type.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={vehicle.status}
                onValueChange={(value) =>
                  editVehicleForm.setValue(
                    "status",
                    value as UpdateVehicleFormData["status"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(VehicleStatusEnum).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit">Save Changes</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditVehicleOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
