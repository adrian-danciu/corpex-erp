import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentTypeBadge } from "@/components/fleet/DocumentTypeBadge";
import {
  DocumentTypeEnum,
  type CreateVehicleDocumentFormData,
} from "@/lib/schemas/fleet.schema";
import type { Vehicle } from "@/types/fleet.types";
import type { useVehicleDetailController } from "../hooks/useVehicleDetailController";
import { formatDate } from "@/lib/formatters";

type VehicleDetailController = ReturnType<typeof useVehicleDetailController>;

type VehicleDocumentsTabProps = Pick<
  VehicleDetailController,
  | "addDocForm"
  | "addDocOpen"
  | "createDoc"
  | "deleteDoc"
  | "editDocForm"
  | "editDocOpen"
  | "openEditDoc"
  | "setAddDocOpen"
  | "setEditDocOpen"
  | "updateDoc"
> & {
  vehicle: Vehicle;
};

export function VehicleDocumentsTab({
  addDocForm,
  addDocOpen,
  createDoc,
  deleteDoc,
  editDocForm,
  editDocOpen,
  openEditDoc,
  setAddDocOpen,
  setEditDocOpen,
  updateDoc,
  vehicle,
}: VehicleDocumentsTabProps) {
  const documents = vehicle.documents ?? [];

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents</CardTitle>
          <Button
            size="sm"
            onClick={() => setAddDocOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add Document
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="py-4 text-sm text-slate-500">
              No documents added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Issued Date</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <DocumentTypeBadge type={doc.type} />
                    </TableCell>
                    <TableCell>
                      {formatDate(doc.expiryDate)}
                    </TableCell>
                    <TableCell>
                      {formatDate(doc.issuedDate)}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {doc.provider ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDoc(doc)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteDoc({ variables: { id: doc.id } })}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addDocForm.handleSubmit((data) =>
              createDoc({
                variables: {
                  createVehicleDocumentInput: {
                    vehicleId: vehicle.id,
                    ...data,
                    expiryDate: new Date(data.expiryDate),
                    issuedDate: data.issuedDate
                      ? new Date(data.issuedDate)
                      : undefined,
                  },
                },
              }),
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                onValueChange={(v) =>
                  addDocForm.setValue(
                    "type",
                    v as CreateVehicleDocumentFormData["type"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentTypeEnum).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {addDocForm.formState.errors.type && (
                <p className="text-xs text-red-600">
                  {addDocForm.formState.errors.type.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Expiry Date *</Label>
              <Input type="date" {...addDocForm.register("expiryDate")} />
            </div>
            <div className="space-y-2">
              <Label>Issued Date</Label>
              <Input type="date" {...addDocForm.register("issuedDate")} />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input
                {...addDocForm.register("provider")}
                placeholder="e.g. RAR, Allianz"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Document</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDocOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDocOpen} onOpenChange={() => setEditDocOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editDocForm.handleSubmit((data) =>
              updateDoc({
                variables: {
                  updateVehicleDocumentInput: {
                    id: editDocOpen!.id,
                    ...data,
                    expiryDate: data.expiryDate
                      ? new Date(data.expiryDate)
                      : undefined,
                    issuedDate: data.issuedDate
                      ? new Date(data.issuedDate)
                      : undefined,
                  },
                },
              }),
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input type="date" {...editDocForm.register("expiryDate")} />
            </div>
            <div className="space-y-2">
              <Label>Issued Date</Label>
              <Input type="date" {...editDocForm.register("issuedDate")} />
            </div>
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input {...editDocForm.register("provider")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDocOpen(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
