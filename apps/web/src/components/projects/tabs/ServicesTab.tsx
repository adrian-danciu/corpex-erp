import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { GET_PROJECT_SERVICES_QUERY } from "@/graphql/mutations/project.queries";
import {
  CREATE_PROJECT_SERVICE_MUTATION,
  DELETE_PROJECT_SERVICE_MUTATION,
  UPDATE_PROJECT_SERVICE_MUTATION,
} from "@/graphql/mutations/project.mutations";
import { useCurrency } from "@/hooks/useCurrency";
import {
  ProjectServiceStatus,
  type Project,
  type ProjectService,
} from "@/types/project.types";

interface Props {
  project: Project;
  isProjectManager: boolean;
}

export function ServicesTab({ project, isProjectManager }: Props) {
  const { formatMoney } = useCurrency();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("service");
  const [unitPrice, setUnitPrice] = useState("");
  const [vatRate, setVatRate] = useState("19");
  const [status, setStatus] = useState<ProjectServiceStatus>(
    ProjectServiceStatus.DELIVERED,
  );
  const [billable, setBillable] = useState("true");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const variables = { projectId: project.id };
  const { data, refetch } = useQuery<{ projectServices: ProjectService[] }>(
    GET_PROJECT_SERVICES_QUERY,
    { variables, fetchPolicy: "cache-and-network" },
  );

  const reset = () => {
    setOpen(false);
    setDescription("");
    setQuantity("1");
    setUnit("service");
    setUnitPrice("");
    setVatRate("19");
    setStatus(ProjectServiceStatus.DELIVERED);
    setBillable("true");
    setNotes("");
    setError("");
  };

  const [createService, { loading: creating }] = useMutationWithToast(
    CREATE_PROJECT_SERVICE_MUTATION,
    {
      successMessage: "Service added",
      onCompleted: () => {
        reset();
        void refetch();
      },
    },
  );

  const [updateService] = useMutationWithToast(
    UPDATE_PROJECT_SERVICE_MUTATION,
    {
      successMessage: "Service updated",
      onCompleted: () => void refetch(),
    },
  );

  const [deleteService] = useMutationWithToast(
    DELETE_PROJECT_SERVICE_MUTATION,
    {
      successMessage: "Service removed",
      onCompleted: () => void refetch(),
    },
  );

  const services = data?.projectServices ?? [];
  const quantityNumber = Number(quantity) || 0;
  const unitPriceNumber = Number(unitPrice) || 0;
  const vatRateNumber = Number(vatRate) || 0;

  const submit = () => {
    setError("");
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (quantityNumber <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }
    if (unitPriceNumber < 0) {
      setError("Unit price cannot be negative");
      return;
    }
    createService({
      variables: {
        input: {
          projectId: project.id,
          description: description.trim(),
          quantity: quantityNumber,
          unit,
          unitPrice: unitPriceNumber,
          vatRate: vatRateNumber,
          status,
          billable: billable === "true",
          notes: notes || undefined,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project services</CardTitle>
          {isProjectManager && (
            <Button
              size="sm"
              className="gap-2"
              onClick={() => {
                setError("");
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add service
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-sm text-slate-500">
              No services added yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billable</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const total = service.quantity * service.unitPrice;
                  return (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">
                          {service.description}
                        </div>
                        {service.notes && (
                          <div className="text-xs text-slate-500">
                            {service.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          disabled={!isProjectManager}
                          value={service.status}
                          onValueChange={(value) =>
                            updateService({
                              variables: {
                                input: {
                                  projectId: project.id,
                                  serviceId: service.id,
                                  status: value,
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-32">
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
                      </TableCell>
                      <TableCell>
                        <Select
                          disabled={!isProjectManager}
                          value={String(service.billable)}
                          onValueChange={(value) =>
                            updateService({
                              variables: {
                                input: {
                                  projectId: project.id,
                                  serviceId: service.id,
                                  billable: value === "true",
                                },
                              },
                            })
                          }
                        >
                          <SelectTrigger className="h-8 w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Yes</SelectItem>
                            <SelectItem value="false">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        {service.quantity.toLocaleString()} {service.unit}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(service.unitPrice, project.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(total, project.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {isProjectManager && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              deleteService({
                                variables: {
                                  input: {
                                    projectId: project.id,
                                    serviceId: service.id,
                                  },
                                },
                              })
                            }
                            aria-label={`Remove ${service.description}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : reset())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add project service</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                {error}
              </div>
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
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as ProjectServiceStatus)
                  }
                >
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
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={creating}>
                {creating ? "Adding..." : "Add service"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
