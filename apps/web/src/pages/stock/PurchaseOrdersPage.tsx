import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { AlertCircle, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/ui/page-loading";
import { Pagination } from "@/components/common/Pagination";
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
import { useAuthStore } from "@/stores/auth.store";
import { canAccess } from "@/lib/permissions";
import { usePagination } from "@/hooks/usePagination";
import { GET_PURCHASE_ORDERS_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import type { PaginatedResult } from "@/types/pagination.types";
import {
  PurchaseOrderStatus,
  type PurchaseOrder,
} from "@/types/purchaseOrder.types";
import { PurchaseOrderStatusBadge } from "@/components/stock/PurchaseOrderStatusBadge";

const ALL_STATUSES = "__all__";

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = canAccess(user, "stock", "write");
  const { page, pageSize, skip, take, setPage } = usePagination({
    defaultPageSize: 20,
  });
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES);
  const [searchValue, setSearchValue] = useState("");
  const [search, setSearch] = useState("");

  const { data, loading, error } = useQuery<{
    purchaseOrders: PaginatedResult<PurchaseOrder>;
  }>(GET_PURCHASE_ORDERS_QUERY, {
    variables: {
      pagination: { skip, take },
      filter: {
        status:
          statusFilter === ALL_STATUSES
            ? undefined
            : [statusFilter as PurchaseOrderStatus],
        search: search || undefined,
      },
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
    return <PageLoading message="Loading purchase orders..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load purchase orders</p>
      </div>
    );
  }

  const orders = data?.purchaseOrders.items ?? [];
  const totalItems = data?.purchaseOrders.meta.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-slate-600 mt-1">
            Supplier orders and in-transit goods (Marfă în tranzit).
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => navigate("/stock/purchase-orders/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New PO
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            className="grid grid-cols-1 md:grid-cols-[1fr_220px_auto] gap-3 items-end"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchValue.trim());
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="po-search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="po-search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="PO number or supplier name"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-status">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger id="po-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_STATUSES}>All statuses</SelectItem>
                  <SelectItem value={PurchaseOrderStatus.DRAFT}>
                    Draft
                  </SelectItem>
                  <SelectItem value={PurchaseOrderStatus.ORDERED}>
                    Ordered
                  </SelectItem>
                  <SelectItem value={PurchaseOrderStatus.PARTIALLY_RECEIVED}>
                    Partially received
                  </SelectItem>
                  <SelectItem value={PurchaseOrderStatus.FULLY_RECEIVED}>
                    Fully received
                  </SelectItem>
                  <SelectItem value={PurchaseOrderStatus.CANCELLED}>
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {orders.length} purchase order{orders.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">
              No purchase orders match the current filters.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order date</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right">Lines</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() =>
                      navigate(`/stock/purchase-orders/${order.id}`)
                    }
                  >
                    <TableCell className="font-mono text-xs font-medium text-slate-900">
                      <Link
                        to={`/stock/purchase-orders/${order.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.formattedNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{order.supplier?.name ?? "—"}</TableCell>
                    <TableCell>{order.warehouse?.code ?? "—"}</TableCell>
                    <TableCell>
                      <PurchaseOrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>{formatDate(order.expectedDate)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {order.lines.length}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {order.subtotal.toFixed(2)} {order.currency}
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
