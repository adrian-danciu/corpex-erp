import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CREATE_PAYMENT_MUTATION,
  DELETE_INVOICE_MUTATION,
  GET_INVOICE_QUERY,
  GET_INVOICES_QUERY,
  UPDATE_INVOICE_STATUS_MUTATION,
} from "@/graphql/mutations/finance.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { downloadBlob } from "@/lib/download";
import { getInvoiceListPath } from "@/lib/invoice-direction";
import {
  InvoiceStatus,
  type InvoiceQueryResult,
  type RecordPaymentFormValues,
} from "@/types/finance.types";

export function useInvoiceDetailController() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery<InvoiceQueryResult>(
    GET_INVOICE_QUERY,
    { variables: { id }, skip: !id },
  );
  const invoice = data?.invoice ?? null;
  const backPath = invoice
    ? getInvoiceListPath(invoice.isClientInvoice)
    : "/finance/client-invoices";

  const [createPayment, { loading: paymentLoading }] = useMutationWithToast(
    CREATE_PAYMENT_MUTATION,
    {
      successMessage: "Payment recorded",
      onCompleted: () => void refetch(),
    },
  );
  const [updateStatus] = useMutationWithToast(UPDATE_INVOICE_STATUS_MUTATION, {
    refetchQueries: [{ query: GET_INVOICES_QUERY }],
    successMessage: "Invoice status updated",
    onCompleted: () => void refetch(),
  });
  const [deleteInvoice, { loading: deleting }] = useMutationWithToast(
    DELETE_INVOICE_MUTATION,
    {
      refetchQueries: [{ query: GET_INVOICES_QUERY }],
      successMessage: "Invoice deleted",
      onCompleted: () => navigate(backPath),
    },
  );

  const [pdfLoading, setPdfLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const remaining = invoice ? invoice.total - invoice.paidAmount : 0;
  const isClientInvoice = invoice?.isClientInvoice ?? true;
  const labels = {
    paymentButton: isClientInvoice ? "Record Collection" : "Record Payment",
    paymentDialog: isClientInvoice
      ? "Record Collection"
      : "Record Supplier Payment",
    paid: isClientInvoice ? "Collected" : "Paid Out",
    remaining: isClientInvoice ? "Outstanding" : "Still Owed",
    emptyPayment: isClientInvoice
      ? "Record a collection to track progress."
      : "Record a supplier payment to track progress.",
    statusAdvance: isClientInvoice ? "Mark as Sent" : "Mark as Received",
  };

  const downloadPdf = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      const [{ pdf }, { InvoicePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/finance/InvoicePDF"),
      ]);
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob();
      downloadBlob(
        blob,
        `invoice-${invoice.series}-${String(invoice.number).padStart(4, "0")}.pdf`,
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const recordPayment = (payment: RecordPaymentFormValues) => {
    if (!invoice) return;
    void createPayment({
      variables: {
        createPaymentInput: {
          invoiceId: invoice.id,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMethod: payment.paymentMethod,
          reference: payment.reference || undefined,
        },
      },
    });
  };

  const markAsSent = () => {
    if (!invoice) return;
    void updateStatus({
      variables: {
        updateInvoiceStatusInput: {
          id: invoice.id,
          status: InvoiceStatus.SENT,
        },
      },
    });
  };

  const confirmCancel = () => {
    if (!invoice) return;
    void updateStatus({
      variables: {
        updateInvoiceStatusInput: {
          id: invoice.id,
          status: InvoiceStatus.CANCELLED,
        },
      },
    });
    setCancelDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!invoice) return;
    void deleteInvoice({ variables: { id: invoice.id } });
    setDeleteDialogOpen(false);
  };

  return {
    invoice,
    loading,
    error,
    backPath,
    remaining,
    labels,
    paymentLoading,
    deleting,
    pdfLoading,
    cancelDialogOpen,
    deleteDialogOpen,
    goBack: () => navigate(backPath),
    downloadPdf,
    recordPayment,
    markAsSent,
    confirmCancel,
    confirmDelete,
    setCancelDialogOpen,
    setDeleteDialogOpen,
  };
}

export type InvoiceDetailController = ReturnType<
  typeof useInvoiceDetailController
>;
