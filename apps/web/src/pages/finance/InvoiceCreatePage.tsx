import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useLazyQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { toastInfo } from "@/lib/toast";
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInvoiceSchema, type CreateInvoiceFormData } from "@/lib/schemas/invoice.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { PartnersQueryResult } from "@/types/finance.types";
import { PaginatedResult } from "@/types/pagination.types";
import { GET_PARTNERS_QUERY, CREATE_INVOICE_MUTATION, GET_INVOICES_QUERY } from "@/graphql/mutations/finance.mutations";
import { GET_PURCHASE_ORDERS_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import {
  GET_PROJECTS_QUERY,
  GET_PROJECT_COSTS_FOR_INVOICE_QUERY,
} from "@/graphql/mutations/project.queries";
import type { InvoiceLineDraft, Project } from "@/types/project.types";
import type { PurchaseOrder } from "@/types/purchaseOrder.types";
import {
  getInvoiceDirectionConfig,
  partnerMatchesInvoiceDirection,
  type InvoiceDirection,
} from "@/lib/invoice-direction";
import {
  buildSupplierInvoiceItemsFromReceipts,
  getSelectedPurchaseOrderReceipts,
} from "@/lib/supplier-invoice-lines";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

type InvoiceCreatePageProps = {
  invoiceDirection?: InvoiceDirection;
};

export default function InvoiceCreatePage({
  invoiceDirection = "client",
}: InvoiceCreatePageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const directionConfig = getInvoiceDirectionConfig(invoiceDirection);
  const isClientMode = directionConfig.isClientInvoice;
  const initialProjectId = searchParams.get("projectId") ?? "";

  const { data: partnersData, loading: partnersLoading } = useQuery<PartnersQueryResult>(GET_PARTNERS_QUERY, {
    variables: {
      pagination: { skip: 0, take: 100 },
    },
  });

  const partners = (partnersData?.partners?.items ?? []).filter((partner) =>
    partnerMatchesInvoiceDirection(partner.partnerType, invoiceDirection),
  );

  const { data: projectsData } = useQuery<{ projects: Project[] }>(
    GET_PROJECTS_QUERY,
    { variables: { filter: {} }, skip: !isClientMode },
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
    skip: isClientMode,
  });
  const purchaseOrders = purchaseOrdersData?.purchaseOrders.items ?? [];

  const [fetchProjectCosts, { loading: importingCosts }] = useLazyQuery<{
    projectCostsForInvoice: InvoiceLineDraft[];
  }>(GET_PROJECT_COSTS_FOR_INVOICE_QUERY, { fetchPolicy: "network-only" });

  const [createInvoice, { loading: isLoading }] = useMutationWithToast(
    CREATE_INVOICE_MUTATION,
    {
      refetchQueries: [
        {
          query: GET_INVOICES_QUERY,
          variables: { isClientInvoice: isClientMode },
        },
      ],
      successMessage: `${directionConfig.directionLabel} saved`,
      onCompleted: () => navigate(directionConfig.listPath),
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
      isClientInvoice: isClientMode,
      issueDate: today,
      dueDate: defaultDueDate,
      deliveryDate: "",
      currency: "EUR",
      notes: "",
      projectId: isClientMode ? initialProjectId : "",
      purchaseOrderId: "",
      purchaseReceiptId: "",
      items: [{ description: "", quantity: 1, unit: "buc", unitPrice: 0, vatRate: 19 }],
    },
  });

  const selectedPartnerId = useWatch({ control, name: "partnerId" });
  const selectedProjectId = useWatch({ control, name: "projectId" });
  const selectedPurchaseOrderId = useWatch({ control, name: "purchaseOrderId" });
  const filteredPurchaseOrders = useMemo(
    () =>
      isClientMode || !selectedPartnerId
        ? []
        : purchaseOrders.filter((po) => po.supplierId === selectedPartnerId),
    [isClientMode, purchaseOrders, selectedPartnerId],
  );
  const selectedPurchaseOrder = filteredPurchaseOrders.find((po) => po.id === selectedPurchaseOrderId);
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);

  // When project changes (or is provided via URL), pre-fill partnerId from the project
  useEffect(() => {
    if (!isClientMode) return;
    if (!selectedProjectId) return;
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (proj?.partnerId) {
      setValue("partnerId", proj.partnerId, { shouldValidate: true });
    }
  }, [isClientMode, selectedProjectId, projects, setValue]);

  useEffect(() => {
    if (isClientMode) return;

    setValue("purchaseOrderId", "");
    setValue("purchaseReceiptId", "");
    setSelectedReceiptIds([]);
  }, [isClientMode, selectedPartnerId, setValue]);

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
          isClientInvoice: isClientMode,
          currency: "EUR",
          deliveryDate: deliveryDate ? deliveryDate : null,
          projectId: isClientMode && projectId ? projectId : undefined,
          purchaseOrderId: !isClientMode && purchaseOrderId ? purchaseOrderId : undefined,
          purchaseReceiptId: !isClientMode && purchaseReceiptId ? purchaseReceiptId : undefined,
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

  const toggleReceiptSelection = (receiptId: string, checked: boolean) => {
    setSelectedReceiptIds((current) =>
      checked
        ? [...new Set([...current, receiptId])]
        : current.filter((id) => id !== receiptId),
    );
  };

  const importSupplierReceiptLines = () => {
    const selectedReceipts = getSelectedPurchaseOrderReceipts(
      selectedPurchaseOrder,
      selectedReceiptIds,
    );
    const nextItems = buildSupplierInvoiceItemsFromReceipts(selectedReceipts);

    if (nextItems.length === 0) {
      toastInfo("Select at least one NIR with received items.");
      return;
    }

    replace(nextItems);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(directionConfig.listPath)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {directionConfig.createTitle}
          </h1>
          <p className="text-slate-600 mt-1">
            {directionConfig.createDescription}
          </p>
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

        {isClientMode && (
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
        )}

        {/* Partner Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Partner</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{directionConfig.partnerLabel} *</Label>
              <Controller
                name="partnerId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value} disabled={partnersLoading}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          partnersLoading
                            ? "Loading partners..."
                            : `Select a ${directionConfig.partnerLabel.toLowerCase()}`
                        }
                      />
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
              <Label>Invoice Direction</Label>
              <div className="flex h-9 items-center rounded-md border bg-slate-50 px-3 text-sm text-slate-700">
                {directionConfig.directionLabel}
              </div>
            </div>
          </CardContent>
        </Card>

        {!isClientMode && (
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
                        setSelectedReceiptIds([]);
                      }}
                      value={field.value || "__none__"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No purchase order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No purchase order</SelectItem>
                        {filteredPurchaseOrders.map((order) => (
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
                <div className="flex items-center justify-between gap-3">
                  <Label>NIR / receipts</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={importSupplierReceiptLines}
                    disabled={!selectedReceiptIds.length}
                  >
                    Import selected
                  </Button>
                </div>
                {!selectedPurchaseOrder ? (
                  <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    Select a purchase order first.
                  </div>
                ) : selectedPurchaseOrder.receipts.length === 0 ? (
                  <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No NIRs recorded for this purchase order.
                  </div>
                ) : (
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border p-3">
                    {selectedPurchaseOrder.receipts.map((receipt) => {
                      const checked = selectedReceiptIds.includes(receipt.id);
                      const lineCount = receipt.lines?.length ?? 0;

                      return (
                        <label
                          key={receipt.id}
                          className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-slate-50"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              const nextChecked = value === true;
                              toggleReceiptSelection(receipt.id, nextChecked);
                              setValue(
                                "purchaseReceiptId",
                                nextChecked && selectedReceiptIds.length === 0
                                  ? receipt.id
                                  : "",
                              );
                            }}
                          />
                          <span className="space-y-0.5 text-sm">
                            <span className="block font-medium text-slate-900">
                              {receipt.formattedNumber}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {new Date(receipt.receivedDate).toLocaleDateString("ro-RO")} · {lineCount} line{lineCount === 1 ? "" : "s"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
                <p className="text-xs text-slate-500">
                  Selected NIR lines can auto-fill the invoice. You can still add manual charges below.
                </p>
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
          <Button type="button" variant="outline" onClick={() => navigate(directionConfig.listPath)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : directionConfig.submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
