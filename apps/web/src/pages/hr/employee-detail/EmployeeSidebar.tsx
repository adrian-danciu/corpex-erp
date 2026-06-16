import type { NavigateFunction } from "react-router-dom";
import { Calendar, Users } from "lucide-react";
import { EmployeeDocumentsPanel } from "@/components/hr/EmployeeDocumentsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Employee } from "@/types/hr.types";

function LeaveBar({ remaining, total }: { remaining: number; total: number }) {
  const pct =
    total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const color =
    pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Remaining</span>
        <span className="font-medium">
          {remaining} / {total} days
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function employeeName(employee: Employee) {
  return employee.user
    ? `${employee.user.firstName} ${employee.user.lastName}`
    : `${employee.firstName} ${employee.lastName}`;
}

interface EmployeeSidebarProps {
  employee: Employee;
  navigate: NavigateFunction;
}

export function EmployeeSidebar({ employee, navigate }: EmployeeSidebarProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Leave Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LeaveBar
            remaining={employee.remainingLeave}
            total={employee.annualLeaveDays}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-slate-500">Contract Type</p>
            <p className="font-medium">
              {employee.contractType.replace("_", " ")}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Payroll Type</p>
            <p className="font-medium">
              {employee.isContractor ? "B2B contractor" : "Employment contract"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Employment Date</p>
            <p className="font-medium">{formatDate(employee.employmentDate)}</p>
          </div>
          {employee.contractEndDate && (
            <div>
              <p className="text-slate-500">Contract End</p>
              <p className="font-medium">
                {formatDate(employee.contractEndDate)}
              </p>
            </div>
          )}
          <div>
            <p className="text-slate-500">Date of Birth</p>
            <p className="font-medium">{formatDate(employee.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-slate-500">CNP</p>
            <p className="font-medium font-mono">{employee.personalId}</p>
          </div>
          <div>
            <p className="text-slate-500">Gross Salary</p>
            <p className="font-medium">{formatCurrency(employee.salary)}</p>
          </div>
          {employee.manager && (
            <div>
              <p className="text-slate-500">Reports To</p>
              <p className="font-medium">{employeeName(employee.manager)}</p>
            </div>
          )}
          {employee.user ? (
            <div>
              <p className="text-slate-500">Account</p>
              <p className="font-medium text-xs">{employee.user.email}</p>
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="font-medium text-amber-900">No account linked</p>
              <p className="mt-1 text-xs text-amber-800">
                Application access is provisioned by IT from User Accounts.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {employee.subordinates && employee.subordinates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Direct Reports ({employee.subordinates.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employee.subordinates.map((subordinate) => (
              <div
                key={subordinate.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <p className="font-medium">{employeeName(subordinate)}</p>
                  <p className="text-slate-500">{subordinate.position}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/hr/employees/${subordinate.id}`)}
                >
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <EmployeeDocumentsPanel employeeId={employee.id} />
    </div>
  );
}
