import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft, Pencil } from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleStatusBadge } from "@/components/fleet/VehicleStatusBadge";
import { GET_VEHICLE_QUERY } from "@/graphql/queries/fleet.queries";
import {
  GET_CURRENT_PROJECT_FOR_VEHICLE_QUERY,
  GET_PROJECTS_QUERY,
} from "@/graphql/mutations/project.queries";
import type { Project } from "@/types/project.types";
import type { Vehicle } from "@/types/fleet.types";
import { useVehicleDetailController } from "./hooks/useVehicleDetailController";
import { VehicleDocumentsTab } from "./components/VehicleDocumentsTab";
import { VehicleEditDialog } from "./components/VehicleEditDialog";
import { VehicleExpensesTab } from "./components/VehicleExpensesTab";
import { VehicleLeaseTab } from "./components/VehicleLeaseTab";
import { VehicleMileageTab } from "./components/VehicleMileageTab";
import { VehicleOverviewTab } from "./components/VehicleOverviewTab";

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error, refetch } = useQuery<{ vehicle: Vehicle }>(GET_VEHICLE_QUERY, {
    variables: { id },
    fetchPolicy: "cache-and-network",
  });

  const refetchVehicle = () => refetch();

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
              <Button
                variant="outline"
                onClick={() => openEditVehicle(vehicle)}
                className="gap-2"
              >
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
