import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Vehicle } from "@/types/fleet.types";

interface VehicleOverviewTabProps {
  vehicle: Vehicle;
}

export function VehicleOverviewTab({ vehicle }: VehicleOverviewTabProps) {
  const fields: [string, string][] = [
    ["Plate Number", vehicle.plateNumber],
    ["Chassis Number", vehicle.chassisNumber],
    ["Brand", vehicle.brand],
    ["Model", vehicle.model],
    ["Year", String(vehicle.year)],
    [
      "Fuel Type",
      vehicle.fuelType.charAt(0) + vehicle.fuelType.slice(1).toLowerCase(),
    ],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="font-medium text-slate-500">{label}</dt>
              <dd className="mt-1 text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
