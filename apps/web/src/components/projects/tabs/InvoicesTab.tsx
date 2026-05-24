import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import { FilePlus2, Plus, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GET_INVOICES_QUERY, CREATE_INVOICE_MUTATION } from "@/graphql/mutations/finance.mutations";
import { GET_PROJECT_COSTS_FOR_INVOICE_QUERY } from "@/graphql/mutations/project.queries";
import { GET_COMPANY_SETTINGS_QUERY } from "@/graphql/mutations/settings.mutations";
import { useCurrency } from "@/hooks/useCurrency";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { toastInfo } from "@/lib/toast";
import type { Invoice } from "@/types/finance.types";
import type { PaginatedResult } from "@/types/pagination.types";
import type { InvoiceLineDraft, Project } from "@/types/project.types";

interface Props {
  project: Project;
}

function dueDateInDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function sourceLabel(value: InvoiceLineDraft["sourceType"]) {
  if (value === "PROJECT_MATERIAL") return "Material";
  if (value === "PROJECT_SERVICE") return "Service";
  return "Vehicle expense";
}

export function InvoicesTab({ project }: Props) {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const [draftsOpen, setDraftsOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    () => new Set(),
  );

  const { data, loading, refetch } = useQuery<{
    invoices: PaginatedResult<Invoice>;
  }>(GET_INVOICES_QUERY, {
    variables: { pagination: { skip: 0, take: 200 } },
    fetchPolicy: "cache-and-network",
  });
  const { data: settingsData } = useQuery<{
    companySettings: {
      defaultInvoiceSeries: string;
      defaultCurrency: string;
      paymentTermsDays: number;
    };
  }>(GET_COMPANY_SETTINGS_QUERY, { fetchPolicy: "cache-first" });

  const [
    fetchProjectCosts,
    { data: projectCostsData, loading: loadingCosts },
  ] = useLazyQuery<{ projectCostsForInvoice: InvoiceLineDraft[] }>(
    GET_PROJECT_COSTS_FOR_INVOICE_QUERY,
    { fetchPolicy: "network-only" },
  );

  const [createInvoice, { loading: creatingInvoice }] = useMutationWithToast(
    CREATE_INVOICE_MUTATION,
    {
      successMessage: "Project invoice created",
      onCompleted: (result: { createInvoice?: { id: string } }) => {
        setDraftsOpen(false);
        void refetch();
        if (result.createInvoice?.id) {
          navigate(`/finance/invoices/${result.createInvoice.id}`);
        }
      },
    },
  );

  const linked =
    data?.invoices.items.filter((inv) => inv.projectId === project.id) ?? [];
  const drafts = useMemo(
    () => projectCostsData?.projectCostsForInvoice ?? [],
    [projectCostsData?.projectCostsForInvoice],
  );
  const selectedDrafts = useMemo(
    () => drafts.filter((draft) => selectedSources.has(draft.source)),
    [drafts, selectedSources],
  );
  const selectedTotal = selectedDrafts.reduce(
    (sum, draft) => sum + draft.total,
    0,
  );

  const openProjectInvoice = async () => {
    const result = await fetchProjectCosts({
      variables: { projectId: project.id },
    });
    const nextDrafts = result.data?.projectCostsForInvoice ?? [];
    if (nextDrafts.length === 0) {
      toastInfo("No unbilled materials, services, or vehicle expenses on this project yet.");
      return;
    }
    setSelectedSources(new Set(nextDrafts.map((draft) => draft.source)));
    setDraftsOpen(true);
  };

  const toggleSource = (source: string) => {
    setSelectedSources((current) => {
      const next = new Set(current);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  const createFromSelected = () => {
    if (selectedDrafts.length === 0) {
      toastInfo("Select at least one project cost to invoice.");
      return;
    }

    const settings = settingsData?.companySettings;
    const currency = project.currency || settings?.defaultCurrency || "EUR";
    createInvoice({
      variables: {
        createInvoiceInput: {
          series: settings?.defaultInvoiceSeries || "CORP",
          invoiceType: "FISCAL",
          partnerId: project.partnerId,
          isClientInvoice: true,
          issueDate: new Date(),
          dueDate: dueDateInDays(settings?.paymentTermsDays ?? 30),
          currency,
          projectId: project.id,
          notes: `Generated from project ${project.code}`,
          items: selectedDrafts.map((draft) => ({
            description: draft.description,
            quantity: draft.quantity,
            unit: draft.unit,
            unitPrice: draft.unitPrice,
            vatRate: draft.vatRate,
            projectId: project.id,
            sourceType: draft.sourceType,
            sourceId: draft.sourceId,
          })),
        },
      },
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project invoices</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() =>
                navigate(`/finance/invoices/new?projectId=${project.id}`)
              }
            >
              <Plus className="h-4 w-4" />
              Manual invoice
            </Button>
            <Button
              size="sm"
              className="gap-2"
              onClick={openProjectInvoice}
              disabled={loadingCosts}
            >
              <FilePlus2 className="h-4 w-4" />
              {loadingCosts ? "Loading costs..." : "Invoice unbilled costs"}
            </Button>
          </div>
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
                    <TableCell>
                      <Badge variant="outline">{inv.status}</Badge>
                    </TableCell>
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

      <Dialog open={draftsOpen} onOpenChange={setDraftsOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice unbilled project costs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="min-w-[260px]">Description</TableHead>
                    <TableHead className="w-32">Source</TableHead>
                    <TableHead className="w-24 text-right">Qty</TableHead>
                    <TableHead className="w-32 text-right">Unit price</TableHead>
                    <TableHead className="w-32 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drafts.map((draft) => (
                    <TableRow key={draft.source}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSources.has(draft.source)}
                          onCheckedChange={() => toggleSource(draft.source)}
                          aria-label={`Select ${draft.description}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {draft.description}
                        </div>
                        <div className="text-xs text-slate-500">
                          VAT {draft.vatRate}%
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="whitespace-nowrap">
                        {sourceLabel(draft.sourceType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {draft.quantity.toLocaleString()} {draft.unit}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {formatMoney(draft.unitPrice, project.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                        {formatMoney(draft.total, project.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="items-center justify-between gap-3 sm:justify-between">
              <div className="text-sm text-slate-600">
                Selected total:{" "}
                <span className="font-medium text-slate-900">
                  {formatMoney(selectedTotal, project.currency)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDraftsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createFromSelected} disabled={creatingInvoice}>
                  {creatingInvoice ? "Creating..." : "Create invoice"}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
