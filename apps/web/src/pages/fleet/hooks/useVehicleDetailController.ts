import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useDisclosure } from "@/hooks/useDisclosure";
import {
  CREATE_MILEAGE_LOG_MUTATION,
  CREATE_VEHICLE_DOCUMENT_MUTATION,
  CREATE_VEHICLE_EXPENSE_MUTATION,
  CREATE_VEHICLE_LEASE_MUTATION,
  DELETE_MILEAGE_LOG_MUTATION,
  DELETE_VEHICLE_DOCUMENT_MUTATION,
  DELETE_VEHICLE_EXPENSE_MUTATION,
  DELETE_VEHICLE_LEASE_MUTATION,
  UPDATE_VEHICLE_DOCUMENT_MUTATION,
  UPDATE_VEHICLE_LEASE_MUTATION,
  UPDATE_VEHICLE_MUTATION,
} from "@/graphql/mutations/fleet.mutations";
import {
  createMileageLogSchema,
  type CreateMileageLogFormData,
  createVehicleDocumentSchema,
  type CreateVehicleDocumentFormData,
  createVehicleExpenseSchema,
  type CreateVehicleExpenseFormData,
  createVehicleLeaseSchema,
  type CreateVehicleLeaseFormData,
  updateVehicleDocumentSchema,
  type UpdateVehicleDocumentFormData,
  updateVehicleLeaseSchema,
  type UpdateVehicleLeaseFormData,
  updateVehicleSchema,
  type UpdateVehicleFormData,
} from "@/lib/schemas/fleet.schema";
import type { Project } from "@/types/project.types";
import type { Vehicle, VehicleDocument, VehicleLease } from "@/types/fleet.types";

interface UseVehicleDetailControllerProps {
  currentProject: Pick<Project, "id" | "code" | "name"> | null;
  refetchVehicle: () => void;
}

export function useVehicleDetailController({
  currentProject,
  refetchVehicle,
}: UseVehicleDetailControllerProps) {
  const editVehicleDialog = useDisclosure();
  const addDocDialog = useDisclosure();
  const addMileageDialog = useDisclosure();
  const addLeaseDialog = useDisclosure();
  const addExpenseDialog = useDisclosure();
  const [editDocOpen, setEditDocOpen] = useState<VehicleDocument | null>(null);
  const [editLeaseOpen, setEditLeaseOpen] = useState<VehicleLease | null>(null);
  const [expenseProjectId, setExpenseProjectId] = useState("");

  const editVehicleForm = useForm<UpdateVehicleFormData>({
    resolver: zodResolver(updateVehicleSchema),
  });
  const addDocForm = useForm<CreateVehicleDocumentFormData>({
    resolver: zodResolver(createVehicleDocumentSchema),
  });
  const editDocForm = useForm<UpdateVehicleDocumentFormData>({
    resolver: zodResolver(updateVehicleDocumentSchema),
  });
  const mileageForm = useForm<CreateMileageLogFormData>({
    resolver: zodResolver(createMileageLogSchema),
  });
  const addLeaseForm = useForm<CreateVehicleLeaseFormData>({
    resolver: zodResolver(createVehicleLeaseSchema),
  });
  const editLeaseForm = useForm<UpdateVehicleLeaseFormData>({
    resolver: zodResolver(updateVehicleLeaseSchema),
  });
  const expenseForm = useForm<CreateVehicleExpenseFormData>({
    resolver: zodResolver(createVehicleExpenseSchema),
  });

  const [updateVehicle] = useMutationWithToast(UPDATE_VEHICLE_MUTATION, {
    successMessage: "Vehicle updated",
    onCompleted: () => {
      editVehicleDialog.close();
      refetchVehicle();
    },
  });
  const [createDoc] = useMutationWithToast(CREATE_VEHICLE_DOCUMENT_MUTATION, {
    successMessage: "Document added",
    onCompleted: () => {
      addDocDialog.close();
      refetchVehicle();
    },
  });
  const [updateDoc] = useMutationWithToast(UPDATE_VEHICLE_DOCUMENT_MUTATION, {
    successMessage: "Document updated",
    onCompleted: () => {
      setEditDocOpen(null);
      refetchVehicle();
    },
  });
  const [deleteDoc] = useMutationWithToast(DELETE_VEHICLE_DOCUMENT_MUTATION, {
    successMessage: "Document deleted",
    onCompleted: refetchVehicle,
  });
  const [createMileage] = useMutationWithToast(CREATE_MILEAGE_LOG_MUTATION, {
    successMessage: "Mileage logged",
    onCompleted: () => {
      addMileageDialog.close();
      refetchVehicle();
    },
  });
  const [deleteMileage] = useMutationWithToast(DELETE_MILEAGE_LOG_MUTATION, {
    successMessage: "Mileage entry deleted",
    onCompleted: refetchVehicle,
  });
  const [createLease] = useMutationWithToast(CREATE_VEHICLE_LEASE_MUTATION, {
    successMessage: "Lease added",
    onCompleted: () => {
      addLeaseDialog.close();
      refetchVehicle();
    },
  });
  const [updateLease] = useMutationWithToast(UPDATE_VEHICLE_LEASE_MUTATION, {
    successMessage: "Lease updated",
    onCompleted: () => {
      setEditLeaseOpen(null);
      refetchVehicle();
    },
  });
  const [deleteLease] = useMutationWithToast(DELETE_VEHICLE_LEASE_MUTATION, {
    successMessage: "Lease deleted",
    onCompleted: refetchVehicle,
  });
  const [createExpense] = useMutationWithToast(CREATE_VEHICLE_EXPENSE_MUTATION, {
    successMessage: "Expense recorded",
    onCompleted: () => {
      addExpenseDialog.close();
      refetchVehicle();
    },
  });
  const [deleteExpense] = useMutationWithToast(DELETE_VEHICLE_EXPENSE_MUTATION, {
    successMessage: "Expense deleted",
    onCompleted: refetchVehicle,
  });

  const openEditVehicle = (vehicle: Vehicle) => {
    editVehicleForm.reset({
      plateNumber: vehicle.plateNumber,
      chassisNumber: vehicle.chassisNumber,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType as UpdateVehicleFormData["fuelType"],
      status: vehicle.status as UpdateVehicleFormData["status"],
    });
    editVehicleDialog.show();
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

  const handleExpenseOpenChange = (open: boolean) => {
    if (open) {
      setExpenseProjectId(currentProject?.id ?? "");
    }
    addExpenseDialog.setOpen(open);
  };

  return {
    addDocForm,
    addDocOpen: addDocDialog.open,
    addLeaseForm,
    addLeaseOpen: addLeaseDialog.open,
    addMileageOpen: addMileageDialog.open,
    mileageForm,
    createDoc,
    createExpense,
    createLease,
    createMileage,
    deleteDoc,
    deleteExpense,
    deleteLease,
    deleteMileage,
    editDocForm,
    editDocOpen,
    editLeaseForm,
    editLeaseOpen,
    editVehicleForm,
    editVehicleOpen: editVehicleDialog.open,
    expenseForm,
    expenseProjectId,
    handleExpenseOpenChange,
    openEditDoc,
    openEditLease,
    openEditVehicle,
    setAddDocOpen: addDocDialog.setOpen,
    setAddExpenseOpen: addExpenseDialog.setOpen,
    setAddLeaseOpen: addLeaseDialog.setOpen,
    setAddMileageOpen: addMileageDialog.setOpen,
    setEditDocOpen,
    setEditLeaseOpen,
    setEditVehicleOpen: editVehicleDialog.setOpen,
    setExpenseProjectId,
    updateDoc,
    updateLease,
    updateVehicle,
    addExpenseOpen: addExpenseDialog.open,
  };
}
