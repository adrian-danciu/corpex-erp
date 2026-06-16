import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VehicleStatusBadge } from "@/components/fleet/VehicleStatusBadge";
import { GET_VEHICLE_QUERY } from "@/graphql/queries/fleet.queries";
import {
  GET_CURRENT_PROJECT_FOR_VEHICLE_QUERY,
  GET_PROJECTS_QUERY,
} from "@/graphql/mutations/project.queries";
import type {
  CurrentProjectForVehicleQueryResult,
  ProjectsQueryResult,
} from "@/types/project.types";
import type { VehicleQueryResult } from "@/types/fleet.types";
import { useVehicleDetailController } from "./hooks/useVehicleDetailController";
import { VehicleDocumentsTab } from "./components/VehicleDocumentsTab";
import { VehicleEditDialog } from "./components/VehicleEditDialog";
import { VehicleExpensesTab } from "./components/VehicleExpensesTab";
import { VehicleLeaseTab } from "./components/VehicleLeaseTab";
import { VehicleMileageTab } from "./components/VehicleMileageTab";
import { VehicleOverviewTab } from "./components/VehicleOverviewTab";

const VEHICLE_TABS = [
  { value: "overview", label: "Overview" },
  { value: "documents", label: "Documents" },
  { value: "mileage", label: "Mileage" },
  { value: "lease", label: "Lease" },
  { value: "expenses", label: "Expenses" },
] as const;

type VehicleTabValue = (typeof VEHICLE_TABS)[number]["value"];

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<VehicleTabValue>("overview");

  const { data, loading, error, refetch } = useQuery<VehicleQueryResult>(GET_VEHICLE_QUERY, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });

  const refetchVehicle = () => refetch();

  const { data: currentProjectData } = useQuery<CurrentProjectForVehicleQueryResult>(GET_CURRENT_PROJECT_FOR_VEHICLE_QUERY, {
    variables: { vehicleId: id },
    skip: !id,
  });
  const currentProject = currentProjectData?.currentProjectForVehicle ?? null;

  const { data: projectsData } = useQuery<ProjectsQueryResult>(
    GET_PROJECTS_QUERY,
    { variables: { filter: {} } },
  );
  const projectsList = projectsData?.projects ?? [];

  const {
    addDocForm,
    addDocOpen,
    addExpenseOpen,
    addLeaseForm,
    addLeaseOpen,
    addMileageOpen,
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
    editVehicleOpen,
    expenseForm,
    expenseProjectId,
    handleExpenseOpenChange,
    mileageForm,
    openEditDoc,
    openEditLease,
    openEditVehicle,
    setAddDocOpen,
    setAddExpenseOpen,
    setAddLeaseOpen,
    setAddMileageOpen,
    setEditDocOpen,
    setEditLeaseOpen,
    setEditVehicleOpen,
    setExpenseProjectId,
    updateDoc,
    updateLease,
    updateVehicle,
  } = useVehicleDetailController({ currentProject, refetchVehicle });

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

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/fleet")}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <h1 className="break-words text-2xl font-bold text-slate-900 sm:text-3xl">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="shrink-0">
                <VehicleStatusBadge status={vehicle.status} />
              </div>
            </div>
            <p className="text-slate-600 mt-1">{vehicle.plateNumber}</p>
          </div>
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1 lg:w-auto lg:justify-end lg:overflow-visible">
          <Button
            variant="outline"
            onClick={() => openEditVehicle(vehicle)}
            className="shrink-0 gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Vehicle
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as VehicleTabValue)}
        className="space-y-4"
      >
        <div className="md:hidden">
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as VehicleTabValue)}
          >
            <SelectTrigger aria-label="Vehicle section" className="w-full">
              <SelectValue placeholder="Select section" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_TABS.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <TabsList className="hidden md:flex">
          {VEHICLE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <VehicleOverviewTab vehicle={vehicle} />
        </TabsContent>

        <TabsContent value="documents">
          <VehicleDocumentsTab
            addDocForm={addDocForm}
            addDocOpen={addDocOpen}
            createDoc={createDoc}
            deleteDoc={deleteDoc}
            editDocForm={editDocForm}
            editDocOpen={editDocOpen}
            openEditDoc={openEditDoc}
            setAddDocOpen={setAddDocOpen}
            setEditDocOpen={setEditDocOpen}
            updateDoc={updateDoc}
            vehicle={vehicle}
          />
        </TabsContent>

        <TabsContent value="mileage">
          <VehicleMileageTab
            addMileageOpen={addMileageOpen}
            createMileage={createMileage}
            deleteMileage={deleteMileage}
            mileageForm={mileageForm}
            setAddMileageOpen={setAddMileageOpen}
            vehicle={vehicle}
          />
        </TabsContent>

        <TabsContent value="lease">
          <VehicleLeaseTab
            addLeaseForm={addLeaseForm}
            addLeaseOpen={addLeaseOpen}
            createLease={createLease}
            deleteLease={deleteLease}
            editLeaseForm={editLeaseForm}
            editLeaseOpen={editLeaseOpen}
            openEditLease={openEditLease}
            setAddLeaseOpen={setAddLeaseOpen}
            setEditLeaseOpen={setEditLeaseOpen}
            updateLease={updateLease}
            vehicle={vehicle}
          />
        </TabsContent>

        <TabsContent value="expenses">
          <VehicleExpensesTab
            addExpenseOpen={addExpenseOpen}
            createExpense={createExpense}
            currentProject={currentProject}
            deleteExpense={deleteExpense}
            expenseForm={expenseForm}
            expenseProjectId={expenseProjectId}
            handleExpenseOpenChange={handleExpenseOpenChange}
            projectsList={projectsList}
            setAddExpenseOpen={setAddExpenseOpen}
            setExpenseProjectId={setExpenseProjectId}
            totalExpenses={totalExpenses}
            vehicle={vehicle}
          />
        </TabsContent>
      </Tabs>

      <VehicleEditDialog
        editVehicleForm={editVehicleForm}
        editVehicleOpen={editVehicleOpen}
        setEditVehicleOpen={setEditVehicleOpen}
        updateVehicle={updateVehicle}
        vehicle={vehicle}
      />
    </div>
  );
}
