import { AlertCircle } from "lucide-react";
import { RecordReceptionSheet } from "@/components/stock/RecordReceptionSheet";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PurchaseOrderCancelDialog } from "./purchase-order-detail/PurchaseOrderCancelDialog";
import { PurchaseOrderHeader } from "./purchase-order-detail/PurchaseOrderHeader";
import { PurchaseOrderLinesTab } from "./purchase-order-detail/PurchaseOrderLinesTab";
import { PurchaseOrderReceptionsTab } from "./purchase-order-detail/PurchaseOrderReceptionsTab";
import { PurchaseOrderSummaryTab } from "./purchase-order-detail/PurchaseOrderSummaryTab";
import { usePurchaseOrderDetailController } from "./purchase-order-detail/usePurchaseOrderDetailController";

export default function PurchaseOrderDetailPage() {
  const purchaseOrder = usePurchaseOrderDetailController();

  if (purchaseOrder.loading && !purchaseOrder.order) {
    return <PageLoading message="Loading purchase order..." />;
  }

  if (purchaseOrder.error || !purchaseOrder.order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Purchase order not found</p>
      </div>
    );
  }

  const { order } = purchaseOrder;

  return (
    <div className="space-y-6">
      <PurchaseOrderHeader
        canCancel={purchaseOrder.canCancel}
        canConfirm={purchaseOrder.canConfirm}
        canDelete={purchaseOrder.canDelete}
        canReceive={purchaseOrder.canReceive}
        canWrite={purchaseOrder.canWrite}
        confirming={purchaseOrder.confirming}
        deleting={purchaseOrder.deleting}
        onBack={purchaseOrder.backToList}
        onCancel={() => purchaseOrder.setCancelOpen(true)}
        onConfirm={purchaseOrder.handleConfirm}
        onDelete={purchaseOrder.handleDelete}
        onReceive={() => purchaseOrder.setReceptionOpen(true)}
        order={order}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lines">Lines ({order.lines.length})</TabsTrigger>
          <TabsTrigger value="receptions">
            Receptions ({order.receipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PurchaseOrderSummaryTab
            order={order}
            totals={purchaseOrder.totals}
          />
        </TabsContent>

        <TabsContent value="lines" className="space-y-4">
          <PurchaseOrderLinesTab lines={order.lines} />
        </TabsContent>

        <TabsContent value="receptions" className="space-y-4">
          <PurchaseOrderReceptionsTab
            canReceive={purchaseOrder.canReceive}
            receipts={order.receipts}
          />
        </TabsContent>
      </Tabs>

      <RecordReceptionSheet
        order={order}
        open={purchaseOrder.receptionOpen}
        onClose={() => purchaseOrder.setReceptionOpen(false)}
      />

      <PurchaseOrderCancelDialog
        cancelling={purchaseOrder.cancelling}
        cancelReason={purchaseOrder.cancelReason}
        onCancelReasonChange={purchaseOrder.setCancelReason}
        onConfirm={purchaseOrder.handleCancel}
        onOpenChange={purchaseOrder.setCancelOpen}
        open={purchaseOrder.cancelOpen}
      />
    </div>
  );
}
