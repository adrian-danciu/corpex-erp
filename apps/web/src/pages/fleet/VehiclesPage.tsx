import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { Plus, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from "@/components/common/Pagination";
import { VehicleStatusBadge } from "@/components/fleet/VehicleStatusBadge";
import { usePagination } from "@/hooks/usePagination";
import { GET_VEHICLES_QUERY } from "@/graphql/mutations/fleet.queries";
import type { Vehicle } from "@/types/fleet.types";
import type { PaginatedResult } from "@/types/pagination.types";

export default function VehiclesPage() {
  const navigate = useNavigate();
  const { page, pageSize, skip, take, setPage } = usePagination();

  const { data, loading, error } = useQuery<{ vehicles: PaginatedResult<Vehicle> }>(
    GET_VEHICLES_QUERY,
    { variables: { pagination: { skip, take } }, fetchPolicy: "cache-and-network" },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-slate-500">Loading vehicles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Error: {error.message}</div>
      </div>
    );
  }

  const vehicles = data?.vehicles.items ?? [];
  const totalItems = data?.vehicles.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fleet</h1>
          <p className="text-slate-600 mt-1">Manage company vehicles and documents</p>
        </div>
        <Button onClick={() => navigate("/fleet/create")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Car className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No vehicles found</p>
              <p className="text-sm mt-1">Get started by adding your first vehicle</p>
              <Button onClick={() => navigate("/fleet/create")} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b text-left text-sm font-medium text-slate-600">
                    <th className="pb-3">Plate Number</th>
                    <th className="pb-3">Vehicle</th>
                    <th className="pb-3">Year</th>
                    <th className="pb-3">Fuel Type</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b hover:bg-slate-50">
                      <td className="py-4 font-medium text-slate-900">{vehicle.plateNumber}</td>
                      <td className="py-4 text-slate-700">
                        {vehicle.brand} {vehicle.model}
                      </td>
                      <td className="py-4 text-slate-700">{vehicle.year}</td>
                      <td className="py-4 text-slate-600 capitalize">
                        {vehicle.fuelType.toLowerCase()}
                      </td>
                      <td className="py-4">
                        <VehicleStatusBadge status={vehicle.status} />
                      </td>
                      <td className="py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/fleet/${vehicle.id}`)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  );
}
