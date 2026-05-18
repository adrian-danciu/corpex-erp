import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  RECORD_PURCHASE_ORDER_RECEIPT_MUTATION,
  GET_PURCHASE_ORDER_QUERY,
} from "@/graphql/mutations/purchaseOrders.mutations";
import {
  recordReceiptSchema,
  type RecordReceiptFormData,
} from "@/lib/schemas/purchaseOrder.schema";
import type {
  PurchaseOrder,
  PurchaseOrderReceipt,
} from "@/types/purchaseOrder.types";

interface Props {
  order: PurchaseOrder;
  open: boolean;
  onClose: () => void;
  onSaved?: (receipt: PurchaseOrderReceipt) => void;
}

const today = () => new Date().toISOString().slice(0, 10);

export function RecordReceptionSheet({ order, open, onClose, onSaved }: Props) {
  const outstandingLines = order.lines.filter(
    (l) => l.qtyOutstanding > 0,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RecordReceiptFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recordReceiptSchema) as any,
    defaultValues: {
      orderId: order.id,
      receivedDate: today(),
      notes: "",
      lines: outstandingLines.map((l) => ({
        orderLineId: l.id,
        qtyReceived: l.qtyOutstanding,
      })),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        orderId: order.id,
        receivedDate: today(),
        notes: "",
        lines: outstandingLines.map((l) => ({
          orderLineId: l.id,
          qtyReceived: l.qtyOutstanding,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order.id]);

  const [recordReceipt] = useMutationWithToast<{
    recordPurchaseOrderReceipt: PurchaseOrderReceipt;
  }>(RECORD_PURCHASE_ORDER_RECEIPT_MUTATION, {
    successMessage: (d) =>
      `Reception ${d.recordPurchaseOrderReceipt.formattedNumber} recorded`,
    refetchQueries: [
      { query: GET_PURCHASE_ORDER_QUERY, variables: { id: order.id } },
    ],
    awaitRefetchQueries: true,
  });

  const lineValues = watch("lines");

  const onSubmit = async (values: RecordReceiptFormData) => {
    const filtered = values.lines.filter((l) => Number(l.qtyReceived) > 0);
    if (filtered.length === 0) {
      return;
    }
    try {
      const res = await recordReceipt({
        variables: {
          input: {
            orderId: values.orderId,
            receivedDate: values.receivedDate
              ? new Date(values.receivedDate).toISOString()
              : undefined,
            notes: values.notes || undefined,
            lines: filtered.map((l) => ({
              orderLineId: l.orderLineId,
              qtyReceived: Number(l.qtyReceived),
            })),
          },
        },
      });
      if (res.data?.recordPurchaseOrderReceipt) {
        onSaved?.(res.data.recordPurchaseOrderReceipt);
      }
      onClose();
    } catch {
      // toast already shown by useMutationWithToast
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[640px] p-0 gap-0 flex flex-col"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <SheetHeader className="border-b border-slate-200 px-6 py-4 gap-1">
            <SheetDescription className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {order.formattedNumber} · {order.supplier?.name ?? "Supplier"}
            </SheetDescription>
            <SheetTitle className="text-xl font-semibold leading-tight text-slate-900">
              Record reception (NIR)
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="receivedDate">Reception date</Label>
                <Input
                  id="receivedDate"
                  type="date"
                  {...register("receivedDate")}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="Optional remarks…"
                  {...register("notes")}
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
                Lines
              </h3>
              {outstandingLines.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nothing left to receive on this purchase order.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right w-32">
                        Receive now
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingLines.map((line, index) => {
                      const fieldError =
                        errors.lines?.[index]?.qtyReceived?.message;
                      const draftValue = lineValues?.[index]?.qtyReceived;
                      const exceeds =
                        Number(draftValue) > line.qtyOutstanding + 1e-6;
                      return (
                        <TableRow key={line.id}>
                          <TableCell>
                            <div className="font-medium">
                              {line.product?.sku} · {line.product?.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              Ordered {line.qtyOrdered} · Received{" "}
                              {line.qtyReceived}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {line.qtyOutstanding}
                          </TableCell>
                          <TableCell>
                            <input
                              type="hidden"
                              value={line.id}
                              {...register(
                                `lines.${index}.orderLineId` as const,
                              )}
                            />
                            <Input
                              type="number"
                              step="0.0001"
                              min="0"
                              max={line.qtyOutstanding}
                              inputMode="decimal"
                              className={`text-right ${exceeds || fieldError ? "border-red-500" : ""}`}
                              {...register(
                                `lines.${index}.qtyReceived` as const,
                                {
                                  valueAsNumber: true,
                                },
                              )}
                            />
                            {exceeds && (
                              <p className="text-xs text-red-500 mt-1">
                                Cannot exceed outstanding
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <SheetFooter className="border-t border-slate-200 px-6 py-3 mt-0 flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || outstandingLines.length === 0}
            >
              {isSubmitting ? "Saving…" : "Record reception"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
