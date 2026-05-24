import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { Plus, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/common/Pagination";
import { VehicleStatusBadge } from "@/components/fleet/VehicleStatusBadge";
import { usePagination } from "@/hooks/usePagination";
import { GET_VEHICLES_QUERY } from "@/graphql/queries/fleet.queries";
import type { Vehicle } from "@/types/fleet.types";
import type { PaginatedResult } from "@/types/pagination.types";
import { PageLoading } from "@/components/ui/page-loading";

export default function VehiclesPage() {
  const navigate = useNavigate();
  const { page, pageSize, skip, take, setPage } = usePagination();

  const { data, loading, error } = useQuery<{ vehicles: PaginatedResult<Vehicle> }>(
    GET_VEHICLES_QUERY,
    { variables: { pagination: { skip, take } }, fetchPolicy: "cache-and-network" },
  );

  if (loading) {
    return <PageLoading message="Loading vehicles..." />;
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
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Fuel Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium text-slate-900">{vehicle.plateNumber}</TableCell>
                    <TableCell className="text-slate-700">
                        {vehicle.brand} {vehicle.model}
                    </TableCell>
                    <TableCell className="text-slate-700">{vehicle.year}</TableCell>
                    <TableCell className="text-slate-600 capitalize">
                        {vehicle.fuelType.toLowerCase()}
                    </TableCell>
                    <TableCell>
                      <VehicleStatusBadge status={vehicle.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/fleet/${vehicle.id}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
