import { InlineError } from "@/components/common/InlineError";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ProjectServiceStatus } from "@/types/project.types";

interface ServiceDialogProps {
  billable: string;
  creating: boolean;
  description: string;
  error: string;
  notes: string;
  onClose: () => void;
  onOpen: () => void;
  onSubmit: () => void;
  open: boolean;
  quantity: string;
  setBillable: (billable: string) => void;
  setDescription: (description: string) => void;
  setNotes: (notes: string) => void;
  setQuantity: (quantity: string) => void;
  setStatus: (status: ProjectServiceStatus) => void;
  setUnit: (unit: string) => void;
  setUnitPrice: (unitPrice: string) => void;
  setVatRate: (vatRate: string) => void;
  status: ProjectServiceStatus;
  unit: string;
  unitPrice: string;
  vatRate: string;
}

export function ServiceDialog({
  billable,
  creating,
  description,
  error,
  notes,
  onClose,
  onOpen,
  onSubmit,
  open,
  quantity,
  setBillable,
  setDescription,
  setNotes,
  setQuantity,
  setStatus,
  setUnit,
  setUnitPrice,
  setVatRate,
  status,
  unit,
  unitPrice,
  vatRate,
}: ServiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpen() : onClose())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add project service</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {error && (
            <InlineError className="p-3 text-red-800" icon={false}>
              {error}
            </InlineError>
          )}
          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Installation labor, consulting, transport..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div>
              <Label>Unit</Label>
              <Input
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Unit price</Label>
              <Input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(event.target.value)}
              />
            </div>
            <div>
              <Label>VAT rate</Label>
              <Input
                type="number"
                step="0.01"
                value={vatRate}
                onChange={(event) => setVatRate(event.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectServiceStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ProjectServiceStatus.PLANNED}>
                    Planned
                  </SelectItem>
                  <SelectItem value={ProjectServiceStatus.DELIVERED}>
                    Delivered
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Billable</Label>
              <Select value={billable} onValueChange={setBillable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={creating}>
              {creating ? "Adding..." : "Add service"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
