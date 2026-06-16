import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/formatters";
import type { Employee } from "@/types/hr.types";

interface EmployeeDetailsCardProps {
  employee: Employee;
}

export function EmployeeDetailsCard({ employee }: EmployeeDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact & Personal Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <p className="text-slate-500">Phone</p>
            <p className="font-medium">{employee.phoneNumber}</p>
          </div>
          <div>
            <p className="text-slate-500">City</p>
            <p className="font-medium">{employee.city}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-slate-500">Address</p>
            <p className="font-medium">
              {employee.address}, {employee.city}, {employee.country}
            </p>
          </div>
        </div>
        <Separator />
        <div className="grid gap-4 md:grid-cols-2 text-sm">
          <div>
            <p className="text-slate-500">Annual Leave Allowance</p>
            <p className="font-medium">{employee.annualLeaveDays} days</p>
          </div>
          <div>
            <p className="text-slate-500">Remaining Leave</p>
            <p className="font-medium">{employee.remainingLeave} days</p>
          </div>
        </div>
        <Separator />
        <p className="text-xs text-slate-400">
          Created {formatDate(employee.createdAt)} · Updated{" "}
          {formatDate(employee.updatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
