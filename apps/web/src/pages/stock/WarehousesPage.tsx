import { useMutation, useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { AlertCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CREATE_WAREHOUSE_MUTATION,
  GET_WAREHOUSES_QUERY,
} from "@/graphql/mutations/stock.mutations";
import type { PaginatedResult } from "@/types/pagination.types";
import type { Warehouse } from "@/types/stock.types";
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";

interface WarehouseFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  country: string;
}

export default function WarehousesPage() {
  const { page, pageSize, skip, take, setPage } = usePagination();
  const { data, loading, error, refetch } = useQuery<{
    warehouses: PaginatedResult<Warehouse>;
  }>(GET_WAREHOUSES_QUERY, {
    variables: { pagination: { skip, take } },
    fetchPolicy: "cache-and-network",
  });

  const [createWarehouse, { loading: creating }] = useMutation<{
    createWarehouse: Warehouse;
  }>(CREATE_WAREHOUSE_MUTATION);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    defaultValues: {
      name: "",
      code: "",
      address: "",
      city: "",
      country: "Romania",
    },
  });

  const onSubmit = async (values: WarehouseFormData) => {
    await createWarehouse({
      variables: {
        createWarehouseInput: {
          name: values.name,
          code: values.code,
          address: values.address || undefined,
          city: values.city || undefined,
          country: values.country || "Romania",
        },
      },
    });
    reset();
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-slate-600">Loading warehouses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load warehouses</p>
      </div>
    );
  }

  const warehouses = data?.warehouses.items ?? [];
  const totalItems = data?.warehouses.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Warehouses</h1>
        <p className="text-slate-600 mt-1">Manage warehouse locations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Warehouse</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  {...register("name", { required: "Name is required" })}
                  className={errors.name ? "border-red-500" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  {...register("code", { required: "Code is required" })}
                  className={errors.code ? "border-red-500" : ""}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...register("city")} />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("country")} />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>
            </div>
            <Button type="submit" disabled={creating} className="gap-2">
              <Plus className="h-4 w-4" />
              {creating ? "Creating..." : "Create Warehouse"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {warehouses.length} Warehouse{warehouses.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warehouses.length === 0 ? (
            <p className="text-sm text-slate-500">No warehouses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-slate-600">
                    <th className="py-2">Code</th>
                    <th className="py-2">Name</th>
                    <th className="py-2">City</th>
                    <th className="py-2">Country</th>
                    <th className="py-2">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((warehouse) => (
                    <tr key={warehouse.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{warehouse.code}</td>
                      <td className="py-2">{warehouse.name}</td>
                      <td className="py-2">{warehouse.city || "-"}</td>
                      <td className="py-2">{warehouse.country}</td>
                      <td className="py-2">{warehouse.address || "-"}</td>
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
