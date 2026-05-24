import { useQuery } from "@apollo/client/react";
import { useState } from "react";
import { GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import { GENERATE_EMPLOYEE_ACCOUNTS_MUTATION } from "@/graphql/mutations/user.mutations";
import type { Employee } from "@/types/hr.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Briefcase,
  Calendar,
  KeyRound,
  Network,
  Phone,
  Plus,
  UserCheck,
} from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";

import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { PaginatedResult } from "@/types/pagination.types";

interface EmployeeAccountGenerationResult {
  employeeId: string;
  employeeName: string | null;
  email: string | null;
  initialPassword: string | null;
  created: boolean;
  message: string;
}

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { page, pageSize, skip, take, setPage } = usePagination();
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [generatedAccounts, setGeneratedAccounts] = useState<
    EmployeeAccountGenerationResult[]
  >([]);
  const [credentialsOpen, setCredentialsOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ employees: PaginatedResult<Employee> }>(
    GET_EMPLOYEES_QUERY,
    {
      variables: {
        pagination: { skip, take },
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const [generateEmployeeAccounts, { loading: generatingAccounts }] =
    useMutationWithToast<{
      generateEmployeeAccounts: EmployeeAccountGenerationResult[];
    }>(GENERATE_EMPLOYEE_ACCOUNTS_MUTATION, {
      successMessage: "Account generation completed",
      onCompleted: (result) => {
        setGeneratedAccounts(result.generateEmployeeAccounts);
        setCredentialsOpen(true);
        setSelectedEmployeeIds([]);
        void refetch();
      },
    });

  if (loading) {
    return <PageLoading message="Loading employees..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading employees: {error.message}</div>
      </div>
    );
  }

  const employees = data?.employees.items || [];
  const totalItems = data?.employees.meta.total || 0;
  const employeesWithoutAccounts = employees.filter((employee) => !employee.userId);
  const selectedCount = selectedEmployeeIds.length;
  const allSelectableOnPageSelected =
    employeesWithoutAccounts.length > 0 &&
    employeesWithoutAccounts.every((employee) =>
      selectedEmployeeIds.includes(employee.id),
    );

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
  };

  const togglePageSelection = () => {
    if (allSelectableOnPageSelected) {
      const pageIds = new Set(employeesWithoutAccounts.map((employee) => employee.id));
      setSelectedEmployeeIds((current) => current.filter((id) => !pageIds.has(id)));
      return;
    }

    setSelectedEmployeeIds((current) => [
      ...new Set([
        ...current,
        ...employeesWithoutAccounts.map((employee) => employee.id),
      ]),
    ]);
  };

  const runBulkAccountGeneration = () => {
    if (selectedEmployeeIds.length === 0) return;
    void generateEmployeeAccounts({
      variables: { employeeIds: selectedEmployeeIds },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600 mt-1">Manage employee records and information</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={runBulkAccountGeneration}
            disabled={selectedCount === 0 || generatingAccounts}
            className="gap-2"
          >
            <KeyRound className="h-4 w-4" />
            {generatingAccounts
              ? "Creating..."
              : `Create accounts${selectedCount ? ` (${selectedCount})` : ""}`}
          </Button>
          <Button variant="outline" onClick={() => navigate("/hr/org-chart")} className="gap-2">
            <Network className="h-4 w-4" />
            Org Chart
          </Button>
          <Button onClick={() => navigate("/hr/employees/new")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(employees.map((e) => e.department)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employees.filter((e) => !e.contractEndDate || new Date(e.contractEndDate) > new Date()).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employees List */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No employees found</p>
              <p className="text-sm mt-1">Get started by adding your first employee</p>
              <Button onClick={() => navigate("/hr/employees/new")} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={allSelectableOnPageSelected}
                        onCheckedChange={togglePageSelection}
                        aria-label="Select employees without accounts"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Contract Type</TableHead>
                    <TableHead>Leave Days</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedEmployeeIds.includes(employee.id)}
                          disabled={Boolean(employee.userId)}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                          aria-label={`Select ${employee.firstName} ${employee.lastName}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {employee.firstName} {employee.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {employee.user?.email ?? "No account"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">{employee.position}</TableCell>
                      <TableCell className="text-slate-700">{employee.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="h-3 w-3" />
                          <span className="text-xs">{employee.phoneNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                          {employee.contractType.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        <span className="font-medium">{employee.remainingLeave}</span> / {employee.annualLeaveDays}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/hr/employees/${employee.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />

      <Dialog open={credentialsOpen} onOpenChange={setCredentialsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Generated account credentials</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Share these temporary credentials with the employees. They will be
              asked to change the password on first sign-in.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Temporary password</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedAccounts.map((result) => (
                  <TableRow key={result.employeeId}>
                    <TableCell>{result.employeeName ?? result.employeeId}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {result.email ?? "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {result.initialPassword ?? "-"}
                    </TableCell>
                    <TableCell
                      className={result.created ? "text-green-700" : "text-amber-700"}
                    >
                      {result.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
