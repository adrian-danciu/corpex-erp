import { useQuery } from "@apollo/client/react";
import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GET_EXPIRING_DOCUMENTS_QUERY } from "@/graphql/mutations/fleet.queries";
import type { ExpiringDocumentSummary } from "@/types/fleet.types";

export function FleetExpiryWidget() {
  const { data, loading } = useQuery<{ expiringDocuments: ExpiringDocumentSummary[] }>(
    GET_EXPIRING_DOCUMENTS_QUERY,
    { variables: { daysAhead: 30 } },
  );

  const summaries = (data?.expiringDocuments ?? []).filter((s) => s.count > 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Fleet — Expiring Documents</CardTitle>
        <Car className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading && <Spinner className="size-5 text-primary" />}
        {!loading && summaries.length === 0 && (
          <p className="text-sm text-green-600 font-medium">All documents up to date</p>
        )}
        {!loading && summaries.length > 0 && (
          <div className="space-y-2">
            {summaries.map((s) => (
              <Link
                key={s.type}
                to="/fleet"
                className="flex items-center justify-between text-sm hover:underline"
              >
                <span className="text-slate-700 font-medium">{s.type}</span>
                <span className="text-orange-600 font-semibold">
                  {s.count} {s.count === 1 ? "vehicle" : "vehicles"}
                </span>
              </Link>
            ))}
            <p className="text-xs text-muted-foreground pt-1">Expiring within 30 days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
