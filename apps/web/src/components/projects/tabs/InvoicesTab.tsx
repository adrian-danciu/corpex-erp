import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { Plus, Receipt } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GET_INVOICES_QUERY } from "@/graphql/mutations/finance.mutations";
import type { Invoice } from "@/types/finance.types";
import type { PaginatedResult } from "@/types/pagination.types";
import type { Project } from "@/types/project.types";

interface Props {
  project: Project;
}

export function InvoicesTab({ project }: Props) {
  const navigate = useNavigate();

  const { data, loading } = useQuery<{
    invoices: PaginatedResult<Invoice>;
  }>(GET_INVOICES_QUERY, {
    variables: { pagination: { skip: 0, take: 200 } },
    fetchPolicy: "cache-and-network",
  });

  const linked =
    data?.invoices.items.filter((inv) => inv.projectId === project.id) ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project invoices</CardTitle>
        <Button
          size="sm"
          className="gap-2"
          onClick={() =>
            navigate(`/finance/invoices/new?projectId=${project.id}`)
          }
        >
          <Plus className="h-4 w-4" />
          Create invoice for project
        </Button>
      </CardHeader>
      <CardContent>
        {loading && linked.length === 0 ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : linked.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No invoices linked to this project yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linked.map((inv) => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/finance/invoices/${inv.id}`)}
                >
                  <TableCell className="font-mono text-slate-900">
                    {inv.series}-{inv.number}
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {inv.invoiceType}
                  </TableCell>
                  <TableCell className="text-slate-700">{inv.status}</TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(inv.issueDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right text-slate-900">
                    {inv.total.toLocaleString()} {inv.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
