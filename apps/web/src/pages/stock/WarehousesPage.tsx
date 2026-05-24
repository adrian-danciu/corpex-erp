import { useQuery } from "@apollo/client/react";
import { useForm } from "react-hook-form";
import { AlertCircle, Plus } from "lucide-react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useAuthStore } from "@/stores/auth.store";
import { canAccess } from "@/lib/permissions";
import { PageLoading } from "@/components/ui/page-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const { user } = useAuthStore();
  const canWrite = canAccess(user, "stock", "write");
  const { page, pageSize, skip, take, setPage } = usePagination();
  const { data, loading, error, refetch } = useQuery<{
    warehouses: PaginatedResult<Warehouse>;
  }>(GET_WAREHOUSES_QUERY, {
    variables: { pagination: { skip, take } },
    fetchPolicy: "cache-and-network",
  });

  const [createWarehouse, { loading: creating }] = useMutationWithToast<{
    createWarehouse: Warehouse;
  }>(CREATE_WAREHOUSE_MUTATION, {
    successMessage: (data) => `Warehouse "${data.createWarehouse.name}" created`,
  });

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
    try {
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
      void refetch();
    } catch {
      // toast already shown
    }
  };

  if (loading) {
    return <PageLoading message="Loading warehouses..." />;
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

      {canWrite && (
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
      )}

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-mono text-xs">{warehouse.code}</TableCell>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell>{warehouse.city || "-"}</TableCell>
                    <TableCell>{warehouse.country}</TableCell>
                    <TableCell>{warehouse.address || "-"}</TableCell>
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
