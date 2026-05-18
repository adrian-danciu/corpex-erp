import { useQuery } from "@apollo/client/react";
import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { GET_IN_TRANSIT_SUMMARY_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import type { InTransitProductSummary } from "@/types/purchaseOrder.types";

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

export function InTransitWidget({ limit = 5 }: { limit?: number }) {
  const { data, loading } = useQuery<{
    inTransitSummary: InTransitProductSummary[];
  }>(GET_IN_TRANSIT_SUMMARY_QUERY, { fetchPolicy: "cache-and-network" });

  const rows = (data?.inTransitSummary ?? []).slice(0, limit);
  const totalUnits = (data?.inTransitSummary ?? []).reduce(
    (sum, r) => sum + r.qtyInTransit,
    0,
  );
  const totalOpenOrders = new Set(
    (data?.inTransitSummary ?? []).flatMap(() => []),
  ).size;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
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
          className="text-sm text-slate-600 hover:text-slate-900 underline-offset-2 hover:underline"
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
          <div className="space-y-2">
            {rows.map((row) => (
              <div
                key={row.productId}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {row.productSku} · {row.productName}
                  </div>
                  <div className="text-xs text-slate-500">
                    {row.openOrderCount} open PO
                    {row.openOrderCount === 1 ? "" : "s"} · ETA{" "}
                    {formatDate(row.earliestExpectedDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-slate-900">
                    {row.qtyInTransit}
                  </div>
                  <div className="text-xs text-slate-500">in transit</div>
                </div>
              </div>
            ))}
            {totalUnits > 0 && (
              <div className="pt-2 text-xs text-slate-500 text-right">
                Total: {totalUnits.toFixed(2)} units across{" "}
                {(data?.inTransitSummary ?? []).length} product
                {(data?.inTransitSummary ?? []).length === 1 ? "" : "s"}
                {totalOpenOrders > 0 ? ` · ${totalOpenOrders} POs` : ""}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
