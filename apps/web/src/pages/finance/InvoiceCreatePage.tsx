import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useLazyQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { toastInfo } from "@/lib/toast";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema, type CreateInvoiceFormData } from "@/lib/schemas/invoice.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Plus, Trash2, Loader2 } from "lucide-react";
import type { Partner } from "@/types/finance.types";
import { PaginatedResult } from "@/types/pagination.types";
import { GET_PARTNERS_QUERY, CREATE_INVOICE_MUTATION, GET_INVOICES_QUERY } from "@/graphql/mutations/finance.mutations";
import { GET_PURCHASE_ORDERS_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import {
  GET_PROJECTS_QUERY,
  GET_PROJECT_COSTS_FOR_INVOICE_QUERY,
} from "@/graphql/mutations/project.queries";
import type { InvoiceLineDraft, Project } from "@/types/project.types";
import type { PurchaseOrder } from "@/types/purchaseOrder.types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function InvoiceCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get("projectId") ?? "";

  const { data: partnersData, loading: partnersLoading } = useQuery<{
    partners: PaginatedResult<Partner>;
  }>(GET_PARTNERS_QUERY, {
    variables: {
      pagination: { skip: 0, take: 100 },
    },
  });

  const partners = partnersData?.partners?.items ?? [];

  const { data: projectsData } = useQuery<{ projects: Project[] }>(
    GET_PROJECTS_QUERY,
    { variables: { filter: {} } },
  );
  const projects = useMemo(
    () => projectsData?.projects ?? [],
    [projectsData?.projects],
  );
  const { data: purchaseOrdersData } = useQuery<{
    purchaseOrders: PaginatedResult<PurchaseOrder>;
  }>(GET_PURCHASE_ORDERS_QUERY, {
    variables: { pagination: { skip: 0, take: 200 }, filter: {} },
    fetchPolicy: "cache-first",
  });
  const purchaseOrders = purchaseOrdersData?.purchaseOrders.items ?? [];

  const [fetchProjectCosts, { loading: importingCosts }] = useLazyQuery<{
    projectCostsForInvoice: InvoiceLineDraft[];
  }>(GET_PROJECT_COSTS_FOR_INVOICE_QUERY, { fetchPolicy: "network-only" });

  const [createInvoice, { loading: isLoading }] = useMutationWithToast(
    CREATE_INVOICE_MUTATION,
    {
      refetchQueries: [{ query: GET_INVOICES_QUERY }],
      successMessage: "Invoice created",
      onCompleted: () => navigate("/finance/invoices"),
    },
  );

  const [{ today, defaultDueDate }] = useState(() => {
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    return {
      today: issueDate.toISOString().split("T")[0],
      defaultDueDate: dueDate.toISOString().split("T")[0],
    };
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createInvoiceSchema) as any,
    defaultValues: {
      series: "CORP",
      invoiceType: "FISCAL",
      partnerId: "",
      isClientInvoice: true,
      issueDate: today,
      dueDate: defaultDueDate,
      deliveryDate: "",
      currency: "EUR",
      notes: "",
      projectId: initialProjectId,
      purchaseOrderId: "",
      purchaseReceiptId: "",
      items: [{ description: "", quantity: 1, unit: "buc", unitPrice: 0, vatRate: 19 }],
    },
  });

  const selectedProjectId = useWatch({ control, name: "projectId" });
  const isClientInvoice = useWatch({ control, name: "isClientInvoice" });
  const selectedPurchaseOrderId = useWatch({ control, name: "purchaseOrderId" });
  const selectedPurchaseOrder = purchaseOrders.find((po) => po.id === selectedPurchaseOrderId);

  // When project changes (or is provided via URL), pre-fill partnerId from the project
  useEffect(() => {
    if (!selectedProjectId) return;
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (proj?.partnerId) {
      setValue("partnerId", proj.partnerId, { shouldValidate: true });
    }
  }, [selectedProjectId, projects, setValue]);

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" }) ?? [];

  // Calculate totals
  const itemTotals = watchedItems.map((item) => {
    const amount = (item.quantity || 0) * (item.unitPrice || 0);
    const vatAmount = amount * ((item.vatRate || 19) / 100);
    return { amount, vatAmount };
  });

  const subtotal = itemTotals.reduce((sum, item) => sum + item.amount, 0);
  const vatTotal = itemTotals.reduce((sum, item) => sum + item.vatAmount, 0);
  const total = subtotal + vatTotal;

  const onSubmit = (data: CreateInvoiceFormData) => {

    const { deliveryDate, projectId, purchaseOrderId, purchaseReceiptId, ...rest } = data;

    void createInvoice({
      variables: {
        createInvoiceInput: {
          ...rest,
          currency: "EUR",
          // Send null when delivery date is empty so backend/Prisma
          // don't receive an invalid Date object
          deliveryDate: deliveryDate ? deliveryDate : null,
          projectId: projectId || undefined,
          purchaseOrderId: purchaseOrderId || undefined,
          purchaseReceiptId: purchaseReceiptId || undefined,
        },
      },
    }).catch(() => {
      // toast already shown
    });
  };

  const importCostsFromProject = async () => {
    if (!selectedProjectId) return;
    const result = await fetchProjectCosts({
      variables: { projectId: selectedProjectId },
    });
    const drafts = result.data?.projectCostsForInvoice ?? [];
    if (drafts.length === 0) {
      toastInfo("No unbilled materials, services, or vehicle expenses on this project yet.");
      return;
    }
    // Replace the items array with imported drafts
    replace(
      drafts.map((d) => ({
        description: d.description,
        quantity: d.quantity,
        unit: d.unit,
        unitPrice: d.unitPrice,
        vatRate: d.vatRate,
        projectId: selectedProjectId,
        sourceType: d.sourceType,
        sourceId: d.sourceId,
      })),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/finance/invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">New Invoice</h1>
          <p className="text-slate-600 mt-1">Create a new fiscal or proforma invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="series">Series</Label>
              <Input id="series" {...register("series")} />
              {errors.series && <p className="text-sm text-red-600">{errors.series.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceType">Invoice Type *</Label>
              <Controller
                name="invoiceType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISCAL">Fiscal Invoice</SelectItem>
                      <SelectItem value="PROFORMA">Proforma Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.invoiceType && <p className="text-sm text-red-600">{errors.invoiceType.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value="EUR" disabled />
            </div>
          </CardContent>
        </Card>

        {/* Project (optional) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Project (optional)</CardTitle>
            {selectedProjectId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={importCostsFromProject}
                disabled={importingCosts}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {importingCosts ? "Importing..." : "Import costs from project"}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Linked project</Label>
              <Controller
                name="projectId"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    value={field.value || "__none__"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No project</SelectItem>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} — {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {selectedProjectId && (
                <p className="text-xs text-slate-500">
                  Partner is auto-set from the project. Use "Import costs from project" to populate line items from issued materials and tagged vehicle expenses.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Partner Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Partner</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Partner *</Label>
              <Controller
                name="partnerId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={partnersLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={partnersLoading ? "Loading partners..." : "Select a partner"} />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.cui})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.partnerId && <p className="text-sm text-red-600">{errors.partnerId.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Direction</Label>
              <Controller
                name="isClientInvoice"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => field.onChange(v === "true")}
                    value={String(field.value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">We invoice them (Client)</SelectItem>
                      <SelectItem value="false">They invoice us (Supplier)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {!isClientInvoice && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Procurement link (optional)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Purchase order</Label>
                <Controller
                  name="purchaseOrderId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value === "__none__" ? "" : value);
                        setValue("purchaseReceiptId", "");
                      }}
                      value={field.value || "__none__"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No purchase order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No purchase order</SelectItem>
                        {purchaseOrders.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            {order.formattedNumber} - {order.supplier?.name ?? "Supplier"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>NIR / receipt</Label>
                <Controller
                  name="purchaseReceiptId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}
                      value={field.value || "__none__"}
                      disabled={!selectedPurchaseOrder?.receipts?.length}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No receipt" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No receipt</SelectItem>
                        {(selectedPurchaseOrder?.receipts ?? []).map((receipt) => (
                          <SelectItem key={receipt.id} value={receipt.id}>
                            {receipt.formattedNumber}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dates</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Issue Date *</Label>
              <Input id="issueDate" type="date" {...register("issueDate")} />
              {errors.issueDate && <p className="text-sm text-red-600">{errors.issueDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
              {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input id="deliveryDate" type="date" {...register("deliveryDate")} />
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: "", quantity: 1, unit: "buc", unitPrice: 0, vatRate: 19 })}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.items?.root && (
              <p className="text-sm text-red-600">{errors.items.root.message}</p>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3">
                {index > 0 && <Separator />}
                <div className="grid gap-3 md:grid-cols-12 items-end">
                  <div className="md:col-span-4 space-y-1">
                    <Label className="text-xs">Description *</Label>
                    <Input
                      {...register(`items.${index}.description`)}
                      placeholder="Product or service description"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="text-xs text-red-600">{errors.items[index].description.message}</p>
                    )}
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs">Qty *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity`)}
                    />
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs">Unit</Label>
                    <Input {...register(`items.${index}.unit`)} />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Unit Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.unitPrice`)}
                    />
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <Label className="text-xs">VAT %</Label>
                    <Input
                      type="number"
                      {...register(`items.${index}.vatRate`)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <div className="h-9 flex items-center px-3 rounded-md border bg-slate-50 text-sm font-medium">
                      {formatCurrency(itemTotals[index]?.amount || 0)}
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Totals */}
            <Separator className="my-4" />
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">VAT:</span>
                  <span className="font-medium">{formatCurrency(vatTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register("notes")}
              placeholder="Additional notes for this invoice..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/finance/invoices")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
