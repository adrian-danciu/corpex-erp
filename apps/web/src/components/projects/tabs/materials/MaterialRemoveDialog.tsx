import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProjectMaterial } from "@/types/project.types";

interface MaterialRemoveDialogProps {
  error: string;
  material: ProjectMaterial | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  removing: boolean;
}

export function MaterialRemoveDialog({
  error,
  material,
  onConfirm,
  onOpenChange,
  removing,
}: MaterialRemoveDialogProps) {
  return (
    <Dialog open={Boolean(material)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove material allocation?</DialogTitle>
        </DialogHeader>
        {material && (
          <div className="space-y-3 text-sm">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
                {error}
              </div>
            )}
            <p className="text-slate-700">
              Removing this allocation will return{" "}
              <span className="font-medium">
                {material.issuedQty} {material.product?.unit ?? ""}
              </span>{" "}
              of <span className="font-medium">{material.product?.name}</span>{" "}
              to <span className="font-mono">{material.warehouse?.code}</span>{" "}
              and remove the cost from the project rollup.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                disabled={removing}
              >
                {removing ? "Removing..." : "Remove and return stock"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
