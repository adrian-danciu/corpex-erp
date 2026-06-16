import { useNavigate } from "react-router-dom";
import { InlineError } from "@/components/common/InlineError";
import type { Project } from "@/types/project.types";
import { useCurrency } from "@/hooks/useCurrency";
import { MaterialAllocationDialog } from "./materials/MaterialAllocationDialog";
import { MaterialRemoveDialog } from "./materials/MaterialRemoveDialog";
import { MaterialsTable } from "./materials/MaterialsTable";
import { useMaterialAllocation } from "./hooks/useMaterialAllocation";

interface Props {
  project: Project;
  isProjectManager: boolean;
}

export function MaterialsTab({ project, isProjectManager }: Props) {
  const navigate = useNavigate();
  const { formatMoney } = useCurrency();
  const {
    allocateOpen,
    allocating,
    closeDialog,
    confirmRemove,
    confirmRemoveMaterial,
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
    removing,
    selectedProduct,
    setConfirmRemove,
    setNotes,
    setQuantity,
    setWarehouseId,
    stockByWarehouse,
    submitAllocate,
    warehouseId,
    warehouses,
  } = useMaterialAllocation(project);

  return (
    <div className="space-y-4">
      {error && !confirmRemove && (
        <InlineError className="p-3 text-red-800" icon={false}>
          {error}
        </InlineError>
      )}

      <MaterialsTable
        formatMoney={formatMoney}
        isProjectManager={isProjectManager}
        materials={materials}
        onAllocate={openAllocateDialog}
        onRemove={setConfirmRemove}
      />

      <MaterialAllocationDialog
        allocating={allocating}
        estimatedTotal={estimatedTotal}
        error={error}
        formatMoney={formatMoney}
        navigate={navigate}
        notes={notes}
        onClose={closeDialog}
        onOpen={openAllocateDialog}
        open={allocateOpen}
        onProductChange={onProductChange}
        onSubmit={submitAllocate}
        productId={productId}
        products={products}
        project={project}
        purchaseDraft={purchaseDraft}
        quantity={quantity}
        quantityNumber={quantityNumber}
        selectedProduct={selectedProduct}
        setNotes={setNotes}
        setQuantity={setQuantity}
        setWarehouseId={setWarehouseId}
        stockByWarehouse={stockByWarehouse}
        warehouseId={warehouseId}
        warehouses={warehouses}
      />

      <MaterialRemoveDialog
        error={error}
        material={confirmRemove}
        onConfirm={confirmRemoveMaterial}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
        removing={removing}
      />
    </div>
  );
}
