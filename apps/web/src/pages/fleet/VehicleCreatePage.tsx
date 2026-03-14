import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@apollo/client/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createVehicleSchema,
  type CreateVehicleFormData,
  FuelTypeEnum,
} from "@/lib/schemas/fleet.schema";
import { CREATE_VEHICLE_MUTATION } from "@/graphql/mutations/fleet.mutations";
import { GET_VEHICLES_QUERY } from "@/graphql/mutations/fleet.queries";

export default function VehicleCreatePage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleFormData>({
    resolver: zodResolver(createVehicleSchema),
  });

  const [createVehicle] = useMutation(CREATE_VEHICLE_MUTATION, {
    refetchQueries: [GET_VEHICLES_QUERY],
    onCompleted: () => navigate("/fleet"),
  });

  const onSubmit = async (data: CreateVehicleFormData) => {
    await createVehicle({
      variables: { createVehicleInput: { ...data, year: Number(data.year) } },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/fleet")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Vehicle</h1>
          <p className="text-slate-600 mt-1">Register a new vehicle in the fleet</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number *</Label>
                <Input
                  id="plateNumber"
                  {...register("plateNumber")}
                  placeholder="e.g. B 123 ABC"
                />
                {errors.plateNumber && (
                  <p className="text-xs text-red-600">{errors.plateNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="chassisNumber">Chassis Number (VIN) *</Label>
                <Input
                  id="chassisNumber"
                  {...register("chassisNumber")}
                  placeholder="17-character VIN"
                />
                {errors.chassisNumber && (
                  <p className="text-xs text-red-600">{errors.chassisNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input id="brand" {...register("brand")} placeholder="e.g. Dacia" />
                {errors.brand && (
                  <p className="text-xs text-red-600">{errors.brand.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input id="model" {...register("model")} placeholder="e.g. Logan" />
                {errors.model && (
                  <p className="text-xs text-red-600">{errors.model.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  {...register("year")}
                  placeholder={String(new Date().getFullYear())}
                />
                {errors.year && (
                  <p className="text-xs text-red-600">{errors.year.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fuel Type *</Label>
                <Select
                  onValueChange={(v) =>
                    setValue("fuelType", v as CreateVehicleFormData["fuelType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FuelTypeEnum).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0) + type.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fuelType && (
                  <p className="text-xs text-red-600">{errors.fuelType.message}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Vehicle"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/fleet")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
