import { AlertCircle, Plus } from "lucide-react";
import { DefectiveStockSheet } from "@/components/stock/DefectiveStockSheet";
import { Pagination } from "@/components/common/Pagination";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/page-loading";
import { ProductEditDialog } from "./products/ProductEditDialog";
import { ProductSearchCard } from "./products/ProductSearchCard";
import { ProductsTableCard } from "./products/ProductsTableCard";
import { useProductsController } from "./products/useProductsController";

export default function ProductsPage() {
  const products = useProductsController();

  if (products.loading) {
    return <PageLoading message="Loading products..." />;
  }

  if (products.error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load products</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">
            Manage stock products and thresholds.
          </p>
        </div>
        {products.canWrite && (
          <Button
            onClick={() => products.navigate("/stock/products/new")}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      <ProductSearchCard
        searchValue={products.searchValue}
        setSearchValue={products.setSearchValue}
        onSearch={(value) => products.setFilter("search", value)}
      />

      <ProductsTableCard
        canWrite={products.canWrite}
        formatMoney={products.formatMoney}
        inTransitMap={products.inTransitMap}
        onEdit={products.setEditing}
        onManageDefective={products.setDefectiveFor}
        products={products.products}
      />

      <Pagination
        currentPage={products.page}
        totalItems={products.totalItems}
        pageSize={products.pageSize}
        onPageChange={products.setPage}
      />

      {products.defectiveFor && (
        <DefectiveStockSheet
          product={products.defectiveFor}
          open={Boolean(products.defectiveFor)}
          onClose={products.closeDefectiveSheet}
        />
      )}

      <ProductEditDialog
        editIsActive={products.editIsActive}
        editUnit={products.editUnit}
        editing={products.editing}
        form={products.editForm}
        onOpenChange={(open) => !open && products.setEditing(null)}
        onSubmit={products.submitEdit}
        saving={products.saving}
      />
    </div>
  );
}
