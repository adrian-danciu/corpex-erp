import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Pencil, Trash2, Plus } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleStatusBadge } from "@/components/fleet/VehicleStatusBadge";
import { DocumentTypeBadge } from "@/components/fleet/DocumentTypeBadge";
import { GET_VEHICLE_QUERY } from "@/graphql/mutations/fleet.queries";
import {
  GET_CURRENT_PROJECT_FOR_VEHICLE_QUERY,
  GET_PROJECTS_QUERY,
} from "@/graphql/mutations/project.queries";
import type { Project } from "@/types/project.types";
import {
  UPDATE_VEHICLE_MUTATION,
  CREATE_VEHICLE_DOCUMENT_MUTATION,
  UPDATE_VEHICLE_DOCUMENT_MUTATION,
  DELETE_VEHICLE_DOCUMENT_MUTATION,
  CREATE_MILEAGE_LOG_MUTATION,
  DELETE_MILEAGE_LOG_MUTATION,
  CREATE_VEHICLE_LEASE_MUTATION,
  UPDATE_VEHICLE_LEASE_MUTATION,
  DELETE_VEHICLE_LEASE_MUTATION,
  CREATE_VEHICLE_EXPENSE_MUTATION,
  DELETE_VEHICLE_EXPENSE_MUTATION,
} from "@/graphql/mutations/fleet.mutations";
import {
  createVehicleDocumentSchema,
  type CreateVehicleDocumentFormData,
  updateVehicleDocumentSchema,
  type UpdateVehicleDocumentFormData,
  createMileageLogSchema,
  type CreateMileageLogFormData,
  createVehicleLeaseSchema,
  type CreateVehicleLeaseFormData,
  updateVehicleLeaseSchema,
  type UpdateVehicleLeaseFormData,
  createVehicleExpenseSchema,
  type CreateVehicleExpenseFormData,
  DocumentTypeEnum,
  ExpenseTypeEnum,
  FuelTypeEnum,
  VehicleStatusEnum,
  updateVehicleSchema,
  type UpdateVehicleFormData,
} from "@/lib/schemas/fleet.schema";
import type { Vehicle, VehicleDocument, VehicleLease } from "@/types/fleet.types";

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [editDocOpen, setEditDocOpen] = useState<VehicleDocument | null>(null);
  const [addMileageOpen, setAddMileageOpen] = useState(false);
  const [addLeaseOpen, setAddLeaseOpen] = useState(false);
  const [editLeaseOpen, setEditLeaseOpen] = useState<VehicleLease | null>(null);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expenseProjectId, setExpenseProjectId] = useState<string>("");

  const { data, loading, error, refetch } = useQuery<{ vehicle: Vehicle }>(GET_VEHICLE_QUERY, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });

  const refetchVehicle = () => refetch();

  const [updateVehicle] = useMutationWithToast(UPDATE_VEHICLE_MUTATION, {
    successMessage: "Vehicle updated",
    onCompleted: () => { setEditVehicleOpen(false); refetchVehicle(); },
  });
  const [createDoc] = useMutationWithToast(CREATE_VEHICLE_DOCUMENT_MUTATION, {
    successMessage: "Document added",
    onCompleted: () => { setAddDocOpen(false); refetchVehicle(); },
  });
  const [updateDoc] = useMutationWithToast(UPDATE_VEHICLE_DOCUMENT_MUTATION, {
    successMessage: "Document updated",
    onCompleted: () => { setEditDocOpen(null); refetchVehicle(); },
  });
  const [deleteDoc] = useMutationWithToast(DELETE_VEHICLE_DOCUMENT_MUTATION, {
    successMessage: "Document deleted",
    onCompleted: refetchVehicle,
  });
  const [createMileage] = useMutationWithToast(CREATE_MILEAGE_LOG_MUTATION, {
    successMessage: "Mileage logged",
    onCompleted: () => { setAddMileageOpen(false); refetchVehicle(); },
  });
  const [deleteMileage] = useMutationWithToast(DELETE_MILEAGE_LOG_MUTATION, {
    successMessage: "Mileage entry deleted",
    onCompleted: refetchVehicle,
  });
  const [createLease] = useMutationWithToast(CREATE_VEHICLE_LEASE_MUTATION, {
    successMessage: "Lease added",
    onCompleted: () => { setAddLeaseOpen(false); refetchVehicle(); },
  });
  const [updateLease] = useMutationWithToast(UPDATE_VEHICLE_LEASE_MUTATION, {
    successMessage: "Lease updated",
    onCompleted: () => { setEditLeaseOpen(null); refetchVehicle(); },
  });
  const [deleteLease] = useMutationWithToast(DELETE_VEHICLE_LEASE_MUTATION, {
    successMessage: "Lease deleted",
    onCompleted: refetchVehicle,
  });
  const [createExpense] = useMutationWithToast(CREATE_VEHICLE_EXPENSE_MUTATION, {
    successMessage: "Expense recorded",
    onCompleted: () => { setAddExpenseOpen(false); refetchVehicle(); },
  });
  const [deleteExpense] = useMutationWithToast(DELETE_VEHICLE_EXPENSE_MUTATION, {
    successMessage: "Expense deleted",
    onCompleted: refetchVehicle,
  });

  const editVehicleForm = useForm<UpdateVehicleFormData>({ resolver: zodResolver(updateVehicleSchema) });
  const addDocForm = useForm<CreateVehicleDocumentFormData>({ resolver: zodResolver(createVehicleDocumentSchema) });
  const editDocForm = useForm<UpdateVehicleDocumentFormData>({ resolver: zodResolver(updateVehicleDocumentSchema) });
  const mileageForm = useForm<CreateMileageLogFormData>({ resolver: zodResolver(createMileageLogSchema) });
  const addLeaseForm = useForm<CreateVehicleLeaseFormData>({ resolver: zodResolver(createVehicleLeaseSchema) });
  const editLeaseForm = useForm<UpdateVehicleLeaseFormData>({ resolver: zodResolver(updateVehicleLeaseSchema) });
  const expenseForm = useForm<CreateVehicleExpenseFormData>({ resolver: zodResolver(createVehicleExpenseSchema) });

  const { data: currentProjectData } = useQuery<{
    currentProjectForVehicle: Pick<Project, "id" | "code" | "name"> | null;
  }>(GET_CURRENT_PROJECT_FOR_VEHICLE_QUERY, {
    variables: { vehicleId: id },
    skip: !id,
  });
  const currentProject = currentProjectData?.currentProjectForVehicle ?? null;

  const { data: projectsData } = useQuery<{ projects: Project[] }>(
    GET_PROJECTS_QUERY,
    { variables: { filter: {} } },
  );
  const projectsList = projectsData?.projects ?? [];

  // Smart default: pre-select the currently-active project when opening the dialog
  useEffect(() => {
    if (addExpenseOpen) {
      setExpenseProjectId(currentProject?.id ?? "");
    }
  }, [addExpenseOpen, currentProject]);

  if (loading) {
    return <PageLoading message="Loading vehicle..." />;
  }

  if (error || !data?.vehicle) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">Vehicle not found.</div>
      </div>
    );
  }

  const vehicle = data.vehicle;
  const totalExpenses = (vehicle.expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

  const openEditVehicle = () => {
    editVehicleForm.reset({
      plateNumber: vehicle.plateNumber,
      chassisNumber: vehicle.chassisNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType as UpdateVehicleFormData["fuelType"],
      status: vehicle.status as UpdateVehicleFormData["status"],
    });
    setEditVehicleOpen(true);
  };

  const openEditDoc = (doc: VehicleDocument) => {
    editDocForm.reset({
      expiryDate: doc.expiryDate.slice(0, 10),
      issuedDate: doc.issuedDate ? doc.issuedDate.slice(0, 10) : "",
      provider: doc.provider ?? "",
    });
    setEditDocOpen(doc);
  };

  const openEditLease = (lease: VehicleLease) => {
    editLeaseForm.reset({
      provider: lease.provider,
      startDate: lease.startDate.slice(0, 10),
      endDate: lease.endDate.slice(0, 10),
      monthlyRate: lease.monthlyRate,
      notes: lease.notes ?? "",
    });
    setEditLeaseOpen(lease);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/fleet")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">
              {vehicle.brand} {vehicle.model}
            </h1>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          <p className="text-slate-600 mt-1">{vehicle.plateNumber}</p>
        </div>
        <Button variant="outline" onClick={openEditVehicle} className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit Vehicle
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="mileage">Mileage</TabsTrigger>
          <TabsTrigger value="lease">Lease</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {(
                  [
                    ["Plate Number", vehicle.plateNumber],
                    ["Chassis Number", vehicle.chassisNumber],
                    ["Brand", vehicle.brand],
                    ["Model", vehicle.model],
                    ["Year", String(vehicle.year)],
                    [
                      "Fuel Type",
                      vehicle.fuelType.charAt(0) + vehicle.fuelType.slice(1).toLowerCase(),
                    ],
                  ] as [string, string][]
                ).map(([label, value]) => (
                  <div key={label}>
                    <dt className="font-medium text-slate-500">{label}</dt>
                    <dd className="text-slate-900 mt-1">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Documents</CardTitle>
              <Button size="sm" onClick={() => setAddDocOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Document
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.documents ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No documents added yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Expiry Date</th>
                      <th className="pb-3">Issued Date</th>
                      <th className="pb-3">Provider</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.documents ?? []).map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">
                          <DocumentTypeBadge type={doc.type} />
                        </td>
                        <td className="py-3">
                          {new Date(doc.expiryDate).toLocaleDateString("ro-RO")}
                        </td>
                        <td className="py-3">
                          {doc.issuedDate
                            ? new Date(doc.issuedDate).toLocaleDateString("ro-RO")
                            : "—"}
                        </td>
                        <td className="py-3 text-slate-600">{doc.provider ?? "—"}</td>
                        <td className="py-3">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mileage">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Mileage Log</CardTitle>
              <Button size="sm" onClick={() => setAddMileageOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.mileageLogs ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No mileage entries yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Odometer (km)</th>
                      <th className="pb-3">Notes</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.mileageLogs ?? []).map((log) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">
                          {new Date(log.date).toLocaleDateString("ro-RO")}
                        </td>
                        <td className="py-3 font-medium">{log.odometer.toLocaleString()}</td>
                        <td className="py-3 text-slate-600">{log.notes ?? "—"}</td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMileage({ variables: { id: log.id } })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lease">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lease Contracts</CardTitle>
              <Button size="sm" onClick={() => setAddLeaseOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Lease
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.leases ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No lease contracts added.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Provider</th>
                      <th className="pb-3">Start Date</th>
                      <th className="pb-3">End Date</th>
                      <th className="pb-3">Monthly Rate</th>
                      <th className="pb-3">Notes</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.leases ?? []).map((lease) => (
                      <tr key={lease.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 font-medium">{lease.provider}</td>
                        <td className="py-3">
                          {new Date(lease.startDate).toLocaleDateString("ro-RO")}
                        </td>
                        <td className="py-3">
                          {new Date(lease.endDate).toLocaleDateString("ro-RO")}
                        </td>
                        <td className="py-3">
                          {lease.monthlyRate.toLocaleString("ro-RO", {
                            style: "currency",
                            currency: "RON",
                          })}
                        </td>
                        <td className="py-3 text-slate-600">{lease.notes ?? "—"}</td>
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditLease(lease)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteLease({ variables: { id: lease.id } })}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Expenses
                {(vehicle.expenses ?? []).length > 0 && (
                  <span className="ml-2 text-sm font-normal text-slate-500">
                    Total:{" "}
                    {totalExpenses.toLocaleString("ro-RO", {
                      style: "currency",
                      currency: "RON",
                    })}
                  </span>
                )}
              </CardTitle>
              <Button size="sm" onClick={() => setAddExpenseOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              {(vehicle.expenses ?? []).length === 0 ? (
                <p className="text-slate-500 text-sm py-4">No expenses recorded.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-slate-600 font-medium">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Description</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vehicle.expenses ?? []).map((expense) => (
                      <tr key={expense.id} className="border-b hover:bg-slate-50">
                        <td className="py-3">
                          {new Date(expense.date).toLocaleDateString("ro-RO")}
                        </td>
                        <td className="py-3 capitalize">{expense.type.toLowerCase()}</td>
                        <td className="py-3 font-medium">
                          {expense.amount.toLocaleString("ro-RO", {
                            style: "currency",
                            currency: "RON",
                          })}
                        </td>
                        <td className="py-3 text-slate-600">{expense.description ?? "—"}</td>
                        <td className="py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteExpense({ variables: { id: expense.id } })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editVehicleOpen} onOpenChange={setEditVehicleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editVehicleForm.handleSubmit((data) =>
              updateVehicle({
                variables: { updateVehicleInput: { id: vehicle.id, ...data } },
              })
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {(["plateNumber", "chassisNumber", "brand", "model"] as const).map((field) => (
                <div key={field} className="space-y-2">
                  <Label>
                    {field.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                  </Label>
                  <Input {...editVehicleForm.register(field)} />
                </div>
              ))}
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" {...editVehicleForm.register("year", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <Label>Fuel Type</Label>
                <Select
                  defaultValue={vehicle.fuelType}
                  onValueChange={(v) =>
                    editVehicleForm.setValue("fuelType", v as UpdateVehicleFormData["fuelType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(FuelTypeEnum).map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.charAt(0) + t.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  defaultValue={vehicle.status}
                  onValueChange={(v) =>
                    editVehicleForm.setValue("status", v as UpdateVehicleFormData["status"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VehicleStatusEnum).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditVehicleOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                    issuedDate: data.issuedDate ? new Date(data.issuedDate) : undefined,
                  },
                },
              })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select
                onValueChange={(v) =>
                  addDocForm.setValue("type", v as CreateVehicleDocumentFormData["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(DocumentTypeEnum).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
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
              <Input {...addDocForm.register("provider")} placeholder="e.g. RAR, Allianz" />
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
                    expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
                    issuedDate: data.issuedDate ? new Date(data.issuedDate) : undefined,
                  },
                },
              })
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

      <Dialog open={addMileageOpen} onOpenChange={setAddMileageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Mileage Entry</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={mileageForm.handleSubmit((data) =>
              createMileage({
                variables: {
                  createMileageLogInput: {
                    vehicleId: vehicle.id,
                    ...data,
                    date: new Date(data.date),
                    odometer: Number(data.odometer),
                  },
                },
              })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...mileageForm.register("date")} />
            </div>
            <div className="space-y-2">
              <Label>Odometer (km) *</Label>
              <Input
                type="number"
                {...mileageForm.register("odometer", { valueAsNumber: true })}
                placeholder="e.g. 125000"
              />
              {mileageForm.formState.errors.odometer && (
                <p className="text-xs text-red-600">
                  {mileageForm.formState.errors.odometer.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...mileageForm.register("notes")} placeholder="Optional notes" />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Entry</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddMileageOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addLeaseOpen} onOpenChange={setAddLeaseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Lease Contract</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={addLeaseForm.handleSubmit((data) =>
              createLease({
                variables: {
                  createVehicleLeaseInput: {
                    vehicleId: vehicle.id,
                    ...data,
                    startDate: new Date(data.startDate),
                    endDate: new Date(data.endDate),
                    monthlyRate: Number(data.monthlyRate),
                  },
                },
              })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Provider *</Label>
              <Input {...addLeaseForm.register("provider")} placeholder="e.g. BCR Leasing" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input type="date" {...addLeaseForm.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input type="date" {...addLeaseForm.register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (RON) *</Label>
              <Input type="number" step="0.01" {...addLeaseForm.register("monthlyRate", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...addLeaseForm.register("notes")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Lease</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddLeaseOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLeaseOpen} onOpenChange={() => setEditLeaseOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lease Contract</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editLeaseForm.handleSubmit((data) =>
              updateLease({
                variables: {
                  updateVehicleLeaseInput: {
                    id: editLeaseOpen!.id,
                    ...data,
                    startDate: data.startDate ? new Date(data.startDate) : undefined,
                    endDate: data.endDate ? new Date(data.endDate) : undefined,
                    monthlyRate: data.monthlyRate ? Number(data.monthlyRate) : undefined,
                  },
                },
              })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Provider</Label>
              <Input {...editLeaseForm.register("provider")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" {...editLeaseForm.register("startDate")} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" {...editLeaseForm.register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Monthly Rate (RON)</Label>
              <Input type="number" step="0.01" {...editLeaseForm.register("monthlyRate", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...editLeaseForm.register("notes")} />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditLeaseOpen(null)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={expenseForm.handleSubmit((data) =>
              createExpense({
                variables: {
                  createVehicleExpenseInput: {
                    vehicleId: vehicle.id,
                    ...data,
                    date: new Date(data.date),
                    amount: Number(data.amount),
                    projectId: expenseProjectId || undefined,
                  },
                },
              })
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                onValueChange={(v) =>
                  expenseForm.setValue("type", v as CreateVehicleExpenseFormData["type"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ExpenseTypeEnum).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0) + t.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (RON) *</Label>
              <Input type="number" step="0.01" {...expenseForm.register("amount", { valueAsNumber: true })} />
              {expenseForm.formState.errors.amount && (
                <p className="text-xs text-red-600">
                  {expenseForm.formState.errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" {...expenseForm.register("date")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                {...expenseForm.register("description")}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Project (optional)</Label>
              <Select
                value={expenseProjectId || "__none__"}
                onValueChange={(v) =>
                  setExpenseProjectId(v === "__none__" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No project</SelectItem>
                  {projectsList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} — {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {currentProject && (
                <p className="text-xs text-slate-500">
                  Defaults to {currentProject.code} (currently active on this vehicle).
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit">Add Expense</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddExpenseOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
