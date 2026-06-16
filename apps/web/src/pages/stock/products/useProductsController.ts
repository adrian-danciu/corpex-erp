import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useForm, useWatch } from "react-hook-form";
import {
  GET_PRODUCTS_QUERY,
  UPDATE_PRODUCT_MUTATION,
} from "@/graphql/mutations/stock.mutations";
import { GET_IN_TRANSIT_SUMMARY_QUERY } from "@/graphql/mutations/purchaseOrders.mutations";
import { useCurrency } from "@/hooks/useCurrency";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { usePagination } from "@/hooks/usePagination";
import { useUrlFilters } from "@/hooks/useUrlFilters";
import { canAccess } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth.store";
import type { InTransitSummaryQueryResult } from "@/types/purchaseOrder.types";
import type { Product, ProductsQueryResult } from "@/types/stock.types";

export interface EditProductFormData {
  name: string;
  description: string;
  category: string;
  unit: string;
  minimumStock: number;
  unitPrice: number;
  isActive: boolean;
}

export function useProductsController() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = canAccess(user, "stock", "write");
  const { getFilter, setFilter } = useUrlFilters();
  const search = getFilter("search");
  const [searchValue, setSearchValue] = useState(search);
  const [editing, setEditing] = useState<Product | null>(null);
  const [defectiveFor, setDefectiveFor] = useState<Product | null>(null);
  const { page, pageSize, skip, take, setPage } = usePagination();
  const { formatMoney } = useCurrency();

  const { data, loading, error, refetch } = useQuery<ProductsQueryResult>(
    GET_PRODUCTS_QUERY,
    {
      variables: {
        pagination: { skip, take },
        search: search || undefined,
      },
      fetchPolicy: "cache-and-network",
    },
  );

  const { data: inTransitData } = useQuery<InTransitSummaryQueryResult>(
    GET_IN_TRANSIT_SUMMARY_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  const inTransitMap = new Map<string, number>(
    (inTransitData?.inTransitSummary ?? []).map((row) => [
      row.productId,
      row.qtyInTransit,
    ]),
  );

  const editForm = useForm<EditProductFormData>();
  const editUnit = useWatch({ control: editForm.control, name: "unit" });
  const editIsActive = useWatch({
    control: editForm.control,
    name: "isActive",
  });

  useEffect(() => {
    if (!editing) return;

    editForm.reset({
      name: editing.name,
      description: editing.description ?? "",
      category: editing.category ?? "",
      unit: editing.unit,
      minimumStock: editing.minimumStock,
      unitPrice: editing.unitPrice,
      isActive: editing.isActive,
    });
  }, [editing, editForm]);

  const [updateProduct, { loading: saving }] = useMutationWithToast(
    UPDATE_PRODUCT_MUTATION,
    {
      successMessage: "Product updated",
      onCompleted: () => {
        setEditing(null);
        void refetch();
      },
    },
  );

  const submitEdit = async (values: EditProductFormData) => {
    if (!editing) return;

    try {
      await updateProduct({
        variables: {
          input: {
            productId: editing.id,
            name: values.name,
            description: values.description || undefined,
            category: values.category || undefined,
            unit: values.unit,
            minimumStock: Number(values.minimumStock) || 0,
            unitPrice: Number(values.unitPrice) || 0,
            isActive: values.isActive,
          },
        },
      });
    } catch {
      // toast already shown
    }
  };

  const closeDefectiveSheet = () => {
    setDefectiveFor(null);
    void refetch();
  };

  return {
    canWrite,
    closeDefectiveSheet,
    defectiveFor,
    editForm,
    editing,
    editIsActive,
    editUnit,
    error,
    formatMoney,
    inTransitMap,
    loading,
    navigate,
    page,
    pageSize,
    products: data?.products.items ?? [],
    saving,
    searchValue,
    setDefectiveFor,
    setEditing,
    setPage,
    setSearchValue,
    setFilter,
    submitEdit,
    totalItems: data?.products.meta.total ?? 0,
  };
}

export type ProductsController = ReturnType<typeof useProductsController>;
