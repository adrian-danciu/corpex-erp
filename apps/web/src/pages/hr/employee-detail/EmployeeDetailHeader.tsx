import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Employee } from "@/types/hr.types";

interface EmployeeDetailHeaderProps {
  deleting: boolean;
  editing: boolean;
  employee: Employee;
  onBack: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function EmployeeDetailHeader({
  deleting,
  editing,
  employee,
  onBack,
  onDelete,
  onEdit,
}: EmployeeDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-slate-500 mt-1">
            {employee.position} · {employee.department}
          </p>
        </div>
      </div>

      {!editing && (
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={onEdit}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-red-600 hover:text-red-700"
            onClick={onDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      )}
    </div>
  );
}
