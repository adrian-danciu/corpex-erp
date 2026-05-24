import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  ProjectServiceStatus,
  type Project,
  type ProjectService,
} from "@/types/project.types";

interface ServicesTableProps {
  formatMoney: (value: number, currency?: string) => string;
  isProjectManager: boolean;
  onAdd: () => void;
  onDelete: (serviceId: string) => void;
  onUpdate: (
    serviceId: string,
    patch: Partial<Pick<ProjectService, "status" | "billable">>,
  ) => void;
  project: Project;
  services: ProjectService[];
}

export function ServicesTable({
  formatMoney,
  isProjectManager,
  onAdd,
  onDelete,
  onUpdate,
  project,
  services,
}: ServicesTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project services</CardTitle>
        {isProjectManager && (
          <Button size="sm" className="gap-2" onClick={onAdd}>
            <Plus className="h-4 w-4" />
            Add service
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <p className="text-sm text-slate-500">No services added yet.</p>
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
                          onUpdate(service.id, {
                            status: value as ProjectServiceStatus,
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
                          onUpdate(service.id, { billable: value === "true" })
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
                          onClick={() => onDelete(service.id)}
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
  );
}
