import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  CANCEL_PURCHASE_ORDER_MUTATION,
  CONFIRM_PURCHASE_ORDER_MUTATION,
  DELETE_PURCHASE_ORDER_MUTATION,
  GET_PURCHASE_ORDER_QUERY,
  GET_PURCHASE_ORDERS_QUERY,
} from "@/graphql/mutations/purchaseOrders.mutations";
import { canAccess } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth.store";
import {
  PurchaseOrderStatus,
  type PurchaseOrderQueryResult,
} from "@/types/purchaseOrder.types";

export function usePurchaseOrderDetailController() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const canWrite = canAccess(user, "stock", "write");

  const [receptionOpen, setReceptionOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { data, loading, error } = useQuery<PurchaseOrderQueryResult>(
    GET_PURCHASE_ORDER_QUERY,
    {
      variables: { id },
      skip: !id,
      fetchPolicy: "cache-and-network",
    },
  );

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

  const order = data?.purchaseOrder;
  const canEdit = order?.status === PurchaseOrderStatus.DRAFT;
  const canConfirm = order?.status === PurchaseOrderStatus.DRAFT;
  const canCancel = order
    ? (
        [
          PurchaseOrderStatus.DRAFT,
          PurchaseOrderStatus.ORDERED,
          PurchaseOrderStatus.PARTIALLY_RECEIVED,
        ] as PurchaseOrderStatus[]
      ).includes(order.status)
    : false;
  const canReceive = order
    ? (
        [
          PurchaseOrderStatus.ORDERED,
          PurchaseOrderStatus.PARTIALLY_RECEIVED,
        ] as PurchaseOrderStatus[]
      ).includes(order.status)
    : false;
  const canDelete = Boolean(canEdit && order?.receipts.length === 0);

  const totals = order
    ? {
        ordered: order.lines.reduce((sum, line) => sum + line.qtyOrdered, 0),
        received: order.lines.reduce((sum, line) => sum + line.qtyReceived, 0),
        outstanding: order.lines.reduce(
          (sum, line) => sum + Math.max(0, line.qtyOutstanding),
          0,
        ),
      }
    : { ordered: 0, received: 0, outstanding: 0 };

  const handleConfirm = () => {
    if (!order) return;
    void confirmOrder({ variables: { id: order.id } }).catch(() => undefined);
  };

  const handleCancel = async () => {
    if (!order) return;
    await cancelOrder({
      variables: { id: order.id, reason: cancelReason || null },
    }).catch(() => undefined);
    setCancelOpen(false);
    setCancelReason("");
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await deleteOrder({ variables: { id: order.id } });
      navigate("/stock/purchase-orders");
    } catch {
      // toast already shown
    }
  };

  return {
    backToList: () => navigate("/stock/purchase-orders"),
    canCancel,
    canConfirm,
    canDelete,
    canReceive,
    canWrite,
    cancelOpen,
    cancelReason,
    cancelling,
    confirming,
    deleting,
    error,
    handleCancel,
    handleConfirm,
    handleDelete,
    loading,
    order,
    receptionOpen,
    setCancelOpen,
    setCancelReason,
    setReceptionOpen,
    totals,
  };
}

export type PurchaseOrderDetailController = ReturnType<
  typeof usePurchaseOrderDetailController
>;
