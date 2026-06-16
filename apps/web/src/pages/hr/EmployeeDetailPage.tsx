import { ArrowLeft } from "lucide-react";
import { InlineError } from "@/components/common/InlineError";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoading } from "@/components/ui/page-loading";
import { EmployeeDetailHeader } from "./employee-detail/EmployeeDetailHeader";
import { EmployeeDetailsCard } from "./employee-detail/EmployeeDetailsCard";
import { EmployeeEditForm } from "./employee-detail/EmployeeEditForm";
import { EmployeeSidebar } from "./employee-detail/EmployeeSidebar";
import { useEmployeeDetailController } from "./employee-detail/useEmployeeDetailController";

export default function EmployeeDetailPage() {
  const employeeDetail = useEmployeeDetailController();

  if (employeeDetail.loading) {
    return <PageLoading message="Loading employee..." />;
  }

  if (employeeDetail.error) {
    return (
      <div className="py-24">
        <InlineError>Failed to load employee</InlineError>
      </div>
    );
  }

  if (!employeeDetail.employee) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={employeeDetail.backToEmployees}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-slate-500">Employee not found.</p>
      </div>
    );
  }

  const { employee } = employeeDetail;

  return (
    <div className="space-y-6">
      <EmployeeDetailHeader
        deleting={employeeDetail.deleting}
        editing={employeeDetail.editing}
        employee={employee}
        onBack={employeeDetail.backToEmployees}
        onDelete={() => employeeDetail.setDeleteDialogOpen(true)}
        onEdit={() => employeeDetail.setEditing(true)}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <EmployeeSidebar employee={employee} navigate={employeeDetail.navigate} />

        <div className="lg:col-span-2">
          {employeeDetail.editing ? (
            <EmployeeEditForm
              allEmployees={employeeDetail.allEmployees}
              form={employeeDetail.form}
              onCancel={employeeDetail.cancelEditing}
              onSubmit={employeeDetail.onSubmit}
              updating={employeeDetail.updating}
            />
          ) : (
            <EmployeeDetailsCard employee={employee} />
          )}
        </div>
      </div>

      <ConfirmationDialog
        open={employeeDetail.deleteDialogOpen}
        onOpenChange={employeeDetail.setDeleteDialogOpen}
        title="Delete employee?"
        description={`This permanently deletes ${employee.firstName} ${employee.lastName}'s employee record. This action cannot be undone.`}
        confirmLabel="Delete employee"
        loading={employeeDetail.deleting}
        onConfirm={employeeDetail.confirmDelete}
      />
    </div>
  );
}
