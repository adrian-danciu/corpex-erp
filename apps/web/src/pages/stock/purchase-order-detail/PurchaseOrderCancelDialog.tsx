import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PurchaseOrderCancelDialogProps {
  cancelling: boolean;
  cancelReason: string;
  onCancelReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function PurchaseOrderCancelDialog({
  cancelling,
  cancelReason,
  onCancelReasonChange,
  onConfirm,
  onOpenChange,
  open,
}: PurchaseOrderCancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onChange={(event) => onCancelReasonChange(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelling}
          >
            Keep order
          </Button>
          <Button
            onClick={onConfirm}
            disabled={cancelling}
            className="bg-red-600 hover:bg-red-700"
          >
            {cancelling ? "Cancelling..." : "Cancel order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
