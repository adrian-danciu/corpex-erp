import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/ui/page-loading";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  CANCEL_PURCHASE_ORDER_MUTATION,
  CONFIRM_PURCHASE_ORDER_MUTATION,
  DELETE_PURCHASE_ORDER_MUTATION,
  GET_PURCHASE_ORDER_QUERY,
  GET_PURCHASE_ORDERS_QUERY,
} from "@/graphql/mutations/purchaseOrders.mutations";
import { useAuthStore } from "@/stores/auth.store";
import { canAccess } from "@/lib/permissions";
import {
  PurchaseOrderStatus,
  type PurchaseOrder,
} from "@/types/purchaseOrder.types";
import { PurchaseOrderStatusBadge } from "@/components/stock/PurchaseOrderStatusBadge";
import { RecordReceptionSheet } from "@/components/stock/RecordReceptionSheet";

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "—";

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString() : "—";

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = canAccess(user, "stock", "write");

  const [receptionOpen, setReceptionOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, loading, error } = useQuery<{
    purchaseOrder: PurchaseOrder;
  }>(GET_PURCHASE_ORDER_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  const [confirmOrder, { loading: confirming }] = useMutationWithToast(
    CONFIRM_PURCHASE_ORDER_MUTATION,
    {
      successMessage: "Order confirmed",
      refetchQueries: [
        { query: GET_PURCHASE_ORDER_QUERY, variables: { id } },
        { query: GET_PURCHASE_ORDERS_QUERY },
      ],
    },
  );

  const [cancelOrder, { loading: cancelling }] = useMutationWithToast(
    CANCEL_PURCHASE_ORDER_MUTATION,
    {
      successMessage: "Order cancelled",
      refetchQueries: [
        { query: GET_PURCHASE_ORDER_QUERY, variables: { id } },
        { query: GET_PURCHASE_ORDERS_QUERY },
      ],
    },
  );

  const [deleteOrder, { loading: deleting }] = useMutationWithToast(
    DELETE_PURCHASE_ORDER_MUTATION,
    {
      successMessage: "Purchase order deleted",
      refetchQueries: [{ query: GET_PURCHASE_ORDERS_QUERY }],
    },
  );

  if (loading && !data) {
    return <PageLoading message="Loading purchase order..." />;
  }

  if (error || !data?.purchaseOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Purchase order not found</p>
      </div>
    );
  }

  const order = data.purchaseOrder;
  const totalOrdered = order.lines.reduce((s, l) => s + l.qtyOrdered, 0);
  const totalReceived = order.lines.reduce((s, l) => s + l.qtyReceived, 0);
  const outstanding = order.lines.reduce(
    (s, l) => s + Math.max(0, l.qtyOutstanding),
    0,
  );
  const canEdit = order.status === PurchaseOrderStatus.DRAFT;
  const canConfirm = order.status === PurchaseOrderStatus.DRAFT;
  const canCancel = (
    [
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.ORDERED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ] as PurchaseOrderStatus[]
  ).includes(order.status);
  const canReceive = (
    [
      PurchaseOrderStatus.ORDERED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ] as PurchaseOrderStatus[]
  ).includes(order.status);
  const canDelete = canEdit && order.receipts.length === 0;

  const handleConfirm = () =>
    confirmOrder({ variables: { id: order.id } }).catch(() => undefined);

  const handleCancel = async () => {
    await cancelOrder({
      variables: { id: order.id, reason: cancelReason || null },
    }).catch(() => undefined);
    setCancelOpen(false);
    setCancelReason("");
  };

  const handleDelete = async () => {
    try {
      await deleteOrder({ variables: { id: order.id } });
      navigate("/stock/purchase-orders");
    } catch {
      // toast already shown
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/stock/purchase-orders")}
          className="gap-2 -ml-2 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to purchase orders
        </Button>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-slate-900">
                {order.formattedNumber}
              </h1>
              <PurchaseOrderStatusBadge status={order.status} />
            </div>
            <p className="text-slate-600 mt-1">
              {order.supplier?.name ?? "Unknown supplier"} · Delivery to{" "}
              {order.warehouse?.code}
            </p>
          </div>

          {canWrite && (
            <div className="flex items-center gap-2 flex-wrap">
              {canConfirm && (
                <Button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {confirming ? "Confirming…" : "Confirm"}
                </Button>
              )}
              {canReceive && (
                <Button
                  onClick={() => setReceptionOpen(true)}
                  className="gap-2"
                >
                  <PackagePlus className="h-4 w-4" />
                  Record reception
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="lines">Lines ({order.lines.length})</TabsTrigger>
          <TabsTrigger value="receptions">
            Receptions ({order.receipts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Supplier" value={order.supplier?.name} />
                <Field
                  label="Supplier CUI"
                  value={order.supplier?.cui ?? "—"}
                />
                <Field
                  label="Warehouse"
                  value={`${order.warehouse?.code} · ${order.warehouse?.name}`}
                />
                <Field label="Currency" value={order.currency} />
                <Field
                  label="Order date"
                  value={formatDate(order.orderDate)}
                />
                <Field
                  label="Expected date"
                  value={formatDate(order.expectedDate)}
                />
                <Field
                  label="Subtotal"
                  value={`${order.subtotal.toFixed(2)} ${order.currency}`}
                />
                <Field
                  label="Total ordered"
                  value={totalOrdered.toFixed(2)}
                />
                <Field
                  label="Total received"
                  value={totalReceived.toFixed(2)}
                />
                <Field
                  label="Outstanding"
                  value={outstanding.toFixed(2)}
                />
                <Field
                  label="Created by"
                  value={
                    order.createdBy
                      ? `${order.createdBy.firstName} ${order.createdBy.lastName}`
                      : "—"
                  }
                />
                <Field
                  label="Created"
                  value={formatDateTime(order.createdAt)}
                />
                {order.cancelledAt && (
                  <Field
                    label="Cancelled"
                    value={formatDateTime(order.cancelledAt)}
                  />
                )}
                {order.cancelReason && (
                  <Field
                    label="Cancel reason"
                    value={order.cancelReason}
                  />
                )}
              </dl>
              {order.notes && (
                <div className="mt-4 rounded-md border bg-slate-50/60 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {order.notes}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.lines.length === 0 ? (
                <p className="text-sm text-slate-500">No line items.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Unit cost</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div className="font-medium">
                            {line.product?.sku} · {line.product?.name}
                          </div>
                          {line.notes && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {line.notes}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.qtyOrdered} {line.product?.unit ?? ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.qtyReceived} {line.product?.unit ?? ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.qtyOutstanding} {line.product?.unit ?? ""}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {line.unitCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          {(line.qtyOrdered * line.unitCost).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receptions" className="space-y-4">
          {order.receipts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-slate-500">
                  No receptions yet.
                  {canReceive &&
                    " Click \"Record reception\" to log the first NIR."}
                </p>
              </CardContent>
            </Card>
          ) : (
            order.receipts.map((receipt) => (
              <Card key={receipt.id}>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="font-mono">
                      {receipt.formattedNumber}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Received on {formatDate(receipt.receivedDate)} by{" "}
                      {receipt.createdBy
                        ? `${receipt.createdBy.firstName} ${receipt.createdBy.lastName}`
                        : "—"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">
                          Qty received
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipt.lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            {line.orderLine?.product?.sku} ·{" "}
                            {line.orderLine?.product?.name}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {line.qtyReceived}{" "}
                            {line.orderLine?.product?.unit ?? ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {receipt.notes && (
                    <p className="mt-3 text-xs text-slate-500 whitespace-pre-wrap">
                      {receipt.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <RecordReceptionSheet
        order={order}
        open={receptionOpen}
        onClose={() => setReceptionOpen(false)}
      />

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel purchase order</DialogTitle>
            <DialogDescription>
              Past receptions remain. Future receptions are blocked.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancelling}
            >
              Keep order
            </Button>
            <Button
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? "Cancelling…" : "Cancel order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value ?? "—"}</div>
    </div>
  );
}
