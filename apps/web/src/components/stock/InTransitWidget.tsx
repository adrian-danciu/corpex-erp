import { useQuery } from "@apollo/client/react";
import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GET_IN_TRANSIT_SUMMARY_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import type { InTransitSummaryQueryResult } from "@/types/purchaseOrder.types";
import { formatDate } from "@/lib/formatters";

export function InTransitWidget({ limit = 5 }: { limit?: number }) {
  const { data, loading } = useQuery<InTransitSummaryQueryResult>(
    GET_IN_TRANSIT_SUMMARY_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  const rows = (data?.inTransitSummary ?? []).slice(0, limit);
  const totalUnits = (data?.inTransitSummary ?? []).reduce(
    (sum, r) => sum + r.qtyInTransit,
    0,
  );

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <PackageOpen className="h-4 w-4 text-slate-900" />
            In-transit Goods
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            Goods ordered from suppliers, not yet received.
          </p>
        </div>
        <Link
          to="/stock/purchase-orders"
          className="shrink-0 text-sm text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
        >
          View all POs →
        </Link>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="h-4 w-4" />
            Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No in-transit goods right now.
          </p>
        ) : (
          <div className="space-y-3">
            <Table className="min-w-[540px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Open POs</TableHead>
                  <TableHead>ETA</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell>
                      <div className="max-w-[260px] truncate font-medium text-slate-900">
                        {row.productSku} · {row.productName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.openOrderCount} open PO
                      {row.openOrderCount === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell>{formatDate(row.earliestExpectedDate)}</TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold tabular-nums text-slate-900">
                        {row.qtyInTransit}
                      </span>
                      <span className="block text-xs text-slate-500">
                        in transit
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalUnits > 0 && (
              <div className="text-right text-xs text-slate-500">
                Total: {totalUnits.toFixed(2)} units across{" "}
                {(data?.inTransitSummary ?? []).length} product
                {(data?.inTransitSummary ?? []).length === 1 ? "" : "s"}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
