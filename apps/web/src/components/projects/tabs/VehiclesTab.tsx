import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GET_PROJECT_VEHICLES_QUERY } from "@/graphql/mutations/project.queries";
import {
  ASSIGN_PROJECT_VEHICLE_MUTATION,
  END_PROJECT_VEHICLE_ASSIGNMENT_MUTATION,
} from "@/graphql/mutations/project.mutations";
import { GET_VEHICLES_QUERY } from "@/graphql/queries/fleet.queries";
import type {
  Project,
  ProjectVehiclesQueryResult,
} from "@/types/project.types";
import type { VehiclesQueryResult } from "@/types/fleet.types";
import { formatDate } from "@/lib/formatters";

interface Props {
  project: Project;
  isProjectManager: boolean;
}

export function VehiclesTab({ project, isProjectManager }: Props) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const variables = { projectId: project.id };

  const { data, refetch } = useQuery<ProjectVehiclesQueryResult>(
    GET_PROJECT_VEHICLES_QUERY,
    {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const { data: vehiclesData } = useQuery<VehiclesQueryResult>(
    GET_VEHICLES_QUERY,
    {
    variables: { pagination: { skip: 0, take: 200 } },
  });

  const [assignVehicle, { loading: assigning }] = useMutationWithToast(
    ASSIGN_PROJECT_VEHICLE_MUTATION,
    {
      successMessage: "Vehicle assigned",
      onCompleted: () => {
        setAssignOpen(false);
        setVehicleId("");
        setStartDate("");
        setEndDate("");
        setNotes("");
        void refetch();
      },
    },
  );

  const [endAssignment] = useMutationWithToast(
    END_PROJECT_VEHICLE_ASSIGNMENT_MUTATION,
    {
      successMessage: "Assignment ended",
      onCompleted: () => void refetch(),
    },
  );

  const assignments = data?.projectVehicles ?? [];
  const vehicles = vehiclesData?.vehicles.items ?? [];

  const submitAssign = () => {
    setError("");
    if (!vehicleId) {
      setError("Pick a vehicle");
      return;
    }
    assignVehicle({
      variables: {
        input: {
          projectId: project.id,
          vehicleId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          notes: notes || undefined,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          {error}
        </div>
      )}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vehicle assignments</CardTitle>
          {isProjectManager && (
            <Button
              size="sm"
              onClick={() => {
                setError("");
                setAssignOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Assign vehicle
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No vehicles assigned yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-32 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a) => {
                  const isOpen = !a.endDate;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-slate-900">
                        {a.vehicle
                          ? `${a.vehicle.plateNumber} — ${a.vehicle.brand} ${a.vehicle.model}`
                          : a.vehicleId}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {formatDate(a.startDate)}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {a.endDate ? (
                          formatDate(a.endDate)
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-transparent bg-green-100 text-green-700"
                          >
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {a.notes ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {isOpen && isProjectManager && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              endAssignment({
                                variables: {
                                  input: {
                                    projectId: project.id,
                                    assignmentId: a.id,
                                  },
                                },
                              })
                            }
                          >
                            End assignment
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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign a vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plateNumber} — {v.brand} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label>End date (optional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setAssignOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitAssign} disabled={assigning}>
                {assigning ? "Saving..." : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
