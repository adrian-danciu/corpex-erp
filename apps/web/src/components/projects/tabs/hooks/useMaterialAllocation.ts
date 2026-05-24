import { useMemo, useState } from "react";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useDisclosure } from "@/hooks/useDisclosure";
import { GET_PROJECT_MATERIALS_QUERY } from "@/graphql/mutations/project.queries";
import {
  ALLOCATE_PROJECT_MATERIAL_MUTATION,
  REMOVE_PROJECT_MATERIAL_MUTATION,
} from "@/graphql/mutations/project.mutations";
import {
  GET_PRODUCTS_QUERY,
  GET_PRODUCT_STOCK_BY_PRODUCT_QUERY,
  GET_WAREHOUSES_QUERY,
} from "@/graphql/mutations/stock.mutations";
import type { PaginatedResult } from "@/types/pagination.types";
import type { Project, ProjectMaterial } from "@/types/project.types";
import type {
  Product,
  ProductStockBreakdown,
  Warehouse,
} from "@/types/stock.types";

interface PurchaseDraft {
  productId: string;
  warehouseId: string;
  quantity: number;
  unitCost: number;
}

export function useMaterialAllocation(project: Project) {
  const allocateDialog = useDisclosure();
  const [confirmRemove, setConfirmRemove] = useState<ProjectMaterial | null>(
    null,
  );
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseDraft, setPurchaseDraft] = useState<PurchaseDraft | null>(
    null,
  );

  const variables = { projectId: project.id };

  const { data, refetch } = useQuery<{
    projectMaterials: ProjectMaterial[];
  }>(GET_PROJECT_MATERIALS_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const { data: productsData } = useQuery<{
    products: PaginatedResult<Product>;
  }>(GET_PRODUCTS_QUERY, {
    variables: { pagination: { skip: 0, take: 200 } },
  });

  const { data: warehousesData } = useQuery<{
    warehouses: PaginatedResult<Warehouse>;
  }>(GET_WAREHOUSES_QUERY, {
    variables: { pagination: { skip: 0, take: 50 } },
  });

  const [fetchProductStock, { data: stockBreakdownData }] = useLazyQuery<{
    productStockByProduct: ProductStockBreakdown[];
  }>(GET_PRODUCT_STOCK_BY_PRODUCT_QUERY, { fetchPolicy: "network-only" });

  const stockByWarehouse = useMemo(() => {
    const map = new Map<string, ProductStockBreakdown>();
    (stockBreakdownData?.productStockByProduct ?? []).forEach((row) => {
      map.set(row.warehouseId, row);
    });
    return map;
  }, [stockBreakdownData]);

  const products = (productsData?.products.items ?? []).filter(
    (product) => product.isActive,
  );
  const warehouses = warehousesData?.warehouses.items ?? [];
  const materials = data?.projectMaterials ?? [];
  const selectedProduct =
    productsData?.products.items.find((product) => product.id === productId) ??
    null;
  const quantityNumber = Number(quantity) || 0;
  const estimatedTotal = selectedProduct
    ? quantityNumber * selectedProduct.unitPrice
    : 0;

  const closeDialog = () => {
    allocateDialog.close();
    setProductId("");
    setWarehouseId("");
    setQuantity("");
    setNotes("");
    setError("");
    setPurchaseDraft(null);
  };

  const [allocateMaterial, { loading: allocating }] = useMutationWithToast(
    ALLOCATE_PROJECT_MATERIAL_MUTATION,
    {
      successMessage: "Material allocated",
      onCompleted: () => {
        closeDialog();
        void refetch();
      },
    },
  );

  const [removeMaterial, { loading: removing }] = useMutationWithToast(
    REMOVE_PROJECT_MATERIAL_MUTATION,
    {
      successMessage: "Material removed",
      onCompleted: () => {
        setConfirmRemove(null);
        void refetch();
      },
    },
  );

  const openAllocateDialog = () => {
    setError("");
    allocateDialog.show();
  };

  const onProductChange = (id: string) => {
    setProductId(id);
    setWarehouseId("");
    if (id) {
      void fetchProductStock({ variables: { productId: id } });
    }
  };

  const submitAllocate = () => {
    setError("");
    if (!productId || !warehouseId || quantityNumber <= 0) {
      setError("Pick a product, a warehouse, and a positive quantity");
      return;
    }

    const stock = stockByWarehouse.get(warehouseId);
    const onHand = stock?.quantity ?? 0;
    if (onHand < quantityNumber) {
      setError(
        `Only ${onHand} ${selectedProduct?.unit ?? ""} on hand in ${
          warehouses.find((warehouse) => warehouse.id === warehouseId)?.code ??
          "this warehouse"
        }`,
      );
      setPurchaseDraft({
        productId,
        warehouseId,
        quantity: quantityNumber - onHand,
        unitCost: selectedProduct?.unitPrice ?? 0,
      });
      return;
    }

    setPurchaseDraft(null);
    void allocateMaterial({
      variables: {
        input: {
          projectId: project.id,
          productId,
          warehouseId,
          quantity: quantityNumber,
          notes: notes || undefined,
        },
      },
    });
  };

  const confirmRemoveMaterial = () => {
    if (!confirmRemove) return;
    void removeMaterial({
      variables: {
        input: {
          projectId: project.id,
          projectMaterialId: confirmRemove.id,
        },
      },
    });
  };

  return {
    allocateOpen: allocateDialog.open,
    closeDialog,
    confirmRemove,
    error,
    estimatedTotal,
    materials,
    notes,
    onProductChange,
    openAllocateDialog,
    productId,
    products,
    purchaseDraft,
    quantity,
    quantityNumber,
    selectedProduct,
    setConfirmRemove,
    setNotes,
    setQuantity,
    setWarehouseId,
    stockByWarehouse,
    submitAllocate,
    confirmRemoveMaterial,
    warehouseId,
    warehouses,
    allocating,
    removing,
  };
}
