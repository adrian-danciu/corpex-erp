import { useQuery } from "@apollo/client/react";
import { GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import type { EmployeesQueryResult } from "@/types/hr.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Calendar,
  Phone,
  Plus,
  UserCheck,
} from "lucide-react";
import { PageLoading } from "@/components/ui/page-loading";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { page, pageSize, skip, take, setPage } = usePagination();

  const { data, loading, error } = useQuery<EmployeesQueryResult>(
    GET_EMPLOYEES_QUERY,
    {
      variables: {
        pagination: { skip, take },
      },
      fetchPolicy: "cache-and-network",
    }
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600 mt-1">Manage employee records and information</p>
        </div>
        <div className="flex gap-2">
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
              <Table className="min-w-[1000px]">
                <TableHeader>
                  <TableRow>
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
    </div>
  );
}
