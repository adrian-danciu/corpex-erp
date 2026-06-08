import { useEffect, useMemo, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CREATE_INVOICE_MUTATION,
  GET_INVOICES_QUERY,
  GET_PARTNERS_QUERY,
} from "@/graphql/mutations/finance.mutations";
import { GET_PURCHASE_ORDERS_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import {
  GET_PROJECT_COSTS_FOR_INVOICE_QUERY,
  GET_PROJECTS_QUERY,
} from "@/graphql/mutations/project.queries";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  getInvoiceDirectionConfig,
  partnerMatchesInvoiceDirection,
  type InvoiceDirection,
} from "@/lib/invoice-direction";
import {
  createInvoiceSchema,
  type CreateInvoiceFormData,
} from "@/lib/schemas/invoice.schema";
import {
  buildSupplierInvoiceItemsFromReceipts,
  getAvailableSupplierPurchaseOrders,
  getSelectedPurchaseOrderReceipts,
} from "@/lib/supplier-invoice-lines";
import { toastInfo } from "@/lib/toast";
import type { PartnersQueryResult } from "@/types/finance.types";
import type {
  ProjectCostsForInvoiceQueryResult,
  ProjectsQueryResult,
} from "@/types/project.types";
import type { PurchaseOrdersQueryResult } from "@/types/purchaseOrder.types";
import type { InvoiceItemTotal } from "./invoice-create.types";

function getDefaultDates() {
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    today: issueDate.toISOString().split("T")[0],
    defaultDueDate: dueDate.toISOString().split("T")[0],
  };
}

function calculateItemTotals(
  items: CreateInvoiceFormData["items"],
): InvoiceItemTotal[] {
  return items.map((item) => {
    const amount = (item.quantity || 0) * (item.unitPrice || 0);
    const vatAmount = amount * ((item.vatRate || 19) / 100);
    return { amount, vatAmount };
  });
}

export function useInvoiceCreateController(invoiceDirection: InvoiceDirection) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const directionConfig = getInvoiceDirectionConfig(invoiceDirection);
  const isClientMode = directionConfig.isClientInvoice;
  const initialProjectId = searchParams.get("projectId") ?? "";

  const { data: partnersData, loading: partnersLoading } =
    useQuery<PartnersQueryResult>(GET_PARTNERS_QUERY, {
      variables: { pagination: { skip: 0, take: 100 } },
    });
  const partners = (partnersData?.partners?.items ?? []).filter((partner) =>
    partnerMatchesInvoiceDirection(partner.partnerType, invoiceDirection),
  );

  const { data: projectsData } = useQuery<ProjectsQueryResult>(
    GET_PROJECTS_QUERY,
    { variables: { filter: {} }, skip: !isClientMode },
  );
  const projects = useMemo(
    () => projectsData?.projects ?? [],
    [projectsData?.projects],
  );

  const { data: purchaseOrdersData } = useQuery<PurchaseOrdersQueryResult>(
    GET_PURCHASE_ORDERS_QUERY,
    {
      variables: { pagination: { skip: 0, take: 200 }, filter: {} },
      fetchPolicy: "network-only",
      skip: isClientMode,
    },
  );
  const purchaseOrders = useMemo(
    () => purchaseOrdersData?.purchaseOrders.items ?? [],
    [purchaseOrdersData?.purchaseOrders.items],
  );

  const [fetchProjectCosts, { loading: importingCosts }] =
    useLazyQuery<ProjectCostsForInvoiceQueryResult>(
      GET_PROJECT_COSTS_FOR_INVOICE_QUERY,
      { fetchPolicy: "network-only" },
    );

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

  const [{ today, defaultDueDate }] = useState(getDefaultDates);
  const form = useForm<CreateInvoiceFormData>({
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
      items: [
        {
          description: "",
          quantity: 1,
          unit: "buc",
          unitPrice: 0,
          vatRate: 19,
        },
      ],
    },
  });
  const { control, setValue } = form;
  const itemFields = useFieldArray({ control, name: "items" });
  const selectedPartnerId = useWatch({ control, name: "partnerId" });
  const selectedProjectId = useWatch({ control, name: "projectId" });
  const selectedPurchaseOrderId = useWatch({
    control,
    name: "purchaseOrderId",
  });
  const watchedItems = useWatch({ control, name: "items" }) ?? [];
  const [selectedReceiptIds, setSelectedReceiptIds] = useState<string[]>([]);

  const filteredPurchaseOrders = useMemo(
    () =>
      isClientMode || !selectedPartnerId
        ? []
        : getAvailableSupplierPurchaseOrders(
            purchaseOrders,
            selectedPartnerId,
          ),
    [isClientMode, purchaseOrders, selectedPartnerId],
  );
  const selectedPurchaseOrder = filteredPurchaseOrders.find(
    (purchaseOrder) => purchaseOrder.id === selectedPurchaseOrderId,
  );

  useEffect(() => {
    if (!isClientMode || !selectedProjectId) return;
    const project = projects.find((item) => item.id === selectedProjectId);
    if (project?.partnerId) {
      setValue("partnerId", project.partnerId, { shouldValidate: true });
    }
  }, [isClientMode, projects, selectedProjectId, setValue]);

  const itemTotals = calculateItemTotals(watchedItems);
  const subtotal = itemTotals.reduce((sum, item) => sum + item.amount, 0);
  const vatTotal = itemTotals.reduce((sum, item) => sum + item.vatAmount, 0);
  const total = subtotal + vatTotal;

  const submit = form.handleSubmit((data) => {
    const {
      deliveryDate,
      projectId,
      purchaseOrderId,
      purchaseReceiptId,
      ...rest
    } = data;

    void createInvoice({
      variables: {
        createInvoiceInput: {
          ...rest,
          isClientInvoice: isClientMode,
          currency: "EUR",
          deliveryDate: deliveryDate || null,
          projectId: isClientMode && projectId ? projectId : undefined,
          purchaseOrderId:
            !isClientMode && purchaseOrderId ? purchaseOrderId : undefined,
          purchaseReceiptId:
            !isClientMode && purchaseReceiptId ? purchaseReceiptId : undefined,
        },
      },
    }).catch(() => {
      // Toast already shown by useMutationWithToast.
    });
  });

  const importCostsFromProject = async () => {
    if (!selectedProjectId) return;
    const result = await fetchProjectCosts({
      variables: { projectId: selectedProjectId },
    });
    const drafts = result.data?.projectCostsForInvoice ?? [];
    if (drafts.length === 0) {
      toastInfo(
        "No unbilled materials, services, or vehicle expenses on this project yet.",
      );
      return;
    }

    itemFields.replace(
      drafts.map((draft) => ({
        description: draft.description,
        quantity: draft.quantity,
        unit: draft.unit,
        unitPrice: draft.unitPrice,
        vatRate: draft.vatRate,
        projectId: selectedProjectId,
        sourceType: draft.sourceType,
        sourceId: draft.sourceId,
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

  const selectPurchaseOrder = (purchaseOrderId: string) => {
    setValue(
      "purchaseOrderId",
      purchaseOrderId === "__none__" ? "" : purchaseOrderId,
    );
    setValue("purchaseReceiptId", "");
    setSelectedReceiptIds([]);
  };

  const selectPartner = (partnerId: string) => {
    setValue("partnerId", partnerId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (isClientMode) return;

    setValue("purchaseOrderId", "");
    setValue("purchaseReceiptId", "");
    setSelectedReceiptIds([]);
  };

  const selectReceipt = (receiptId: string, checked: boolean) => {
    toggleReceiptSelection(receiptId, checked);
    setValue(
      "purchaseReceiptId",
      checked && selectedReceiptIds.length === 0 ? receiptId : "",
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

    itemFields.replace(nextItems);
  };

  return {
    directionConfig,
    isClientMode,
    form,
    itemFields,
    partners,
    partnersLoading,
    projects,
    filteredPurchaseOrders,
    selectedProjectId,
    selectedPurchaseOrder,
    selectedReceiptIds,
    itemTotals,
    subtotal,
    vatTotal,
    total,
    importingCosts,
    isLoading,
    submit,
    cancel: () => navigate(directionConfig.listPath),
    importCostsFromProject,
    importSupplierReceiptLines,
    selectPartner,
    selectPurchaseOrder,
    selectReceipt,
  };
}

export type InvoiceCreateController = ReturnType<
  typeof useInvoiceCreateController
>;
