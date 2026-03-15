import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@apollo/client/react";
import { useForm, Controller } from "react-hook-form";
import {
  GET_EMPLOYEE_QUERY,
  GET_EMPLOYEES_QUERY,
  UPDATE_EMPLOYEE_MUTATION,
  DELETE_EMPLOYEE_MUTATION,
} from "@/graphql/mutations/employee.mutations";
import { Department } from "@/types/hr.types";
import type { Employee, UpdateEmployeeInput } from "@/types/hr.types";
import { PaginatedResult } from "@/types/pagination.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, Users, Calendar, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

function LeaveBar({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;
  const color = pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Remaining</span>
        <span className="font-medium">
          {remaining} / {total} days
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);

  const { data, loading, error, refetch } = useQuery<{ employee: Employee | null }>(GET_EMPLOYEE_QUERY, {
    variables: { id },
    skip: !id,
  });

  const { data: employeesData } = useQuery<{ employees: PaginatedResult<Employee> }>(GET_EMPLOYEES_QUERY, {
    variables: { pagination: { skip: 0, take: 500 } },
  });

  const [updateEmployee, { loading: updating, error: updateError }] = useMutation(UPDATE_EMPLOYEE_MUTATION, {
    onCompleted: () => {
      setEditing(false);
      refetch();
    },
  });

  const [deleteEmployee, { loading: deleting }] = useMutation(DELETE_EMPLOYEE_MUTATION, {
    onCompleted: () => navigate("/hr/employees"),
  });

  const employee = data?.employee;

  const { register, handleSubmit, control, reset } = useForm<UpdateEmployeeInput>({
    values: employee
      ? {
          id: employee.id,
          phoneNumber: employee.phoneNumber,
          address: employee.address,
          city: employee.city,
          position: employee.position,
          department: employee.department,
          salary: employee.salary ?? undefined,
          annualLeaveDays: employee.annualLeaveDays,
          remainingLeave: employee.remainingLeave,
          managerId: employee.managerId ?? undefined,
        }
      : { id: id ?? "" },
  });

  const onSubmit = (values: UpdateEmployeeInput) => {
    updateEmployee({
      variables: {
        updateEmployeeInput: {
          ...values,
          salary: values.salary || undefined,
          managerId: values.managerId || undefined,
        },
      },
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this employee record? This action cannot be undone.")) {
      deleteEmployee({ variables: { id } });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-500">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>Failed to load employee</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/hr/employees")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <p className="text-slate-500">Employee not found.</p>
      </div>
    );
  }

  const allEmployees = (employeesData?.employees.items ?? []).filter((e) => e.id !== employee.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/hr/employees")}>
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
        <div className="flex gap-2">
          {!editing && (
            <>
              <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4" /> Edit
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Leave Balance & Info */}
        <div className="space-y-6">
          {/* Leave Balance */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveBar remaining={employee.remainingLeave} total={employee.annualLeaveDays} />
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Contract Type</p>
                <p className="font-medium">{employee.contractType.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-slate-500">Employment Date</p>
                <p className="font-medium">{format(new Date(employee.employmentDate), "dd MMM yyyy")}</p>
              </div>
              {employee.contractEndDate && (
                <div>
                  <p className="text-slate-500">Contract End</p>
                  <p className="font-medium">{format(new Date(employee.contractEndDate), "dd MMM yyyy")}</p>
                </div>
              )}
              <div>
                <p className="text-slate-500">Date of Birth</p>
                <p className="font-medium">{format(new Date(employee.dateOfBirth), "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-slate-500">CNP</p>
                <p className="font-medium font-mono">{employee.personalId}</p>
              </div>
              {employee.salary && (
                <div>
                  <p className="text-slate-500">Salary</p>
                  <p className="font-medium">
                    {employee.salary.toLocaleString("ro-RO", { style: "currency", currency: "RON" })}
                  </p>
                </div>
              )}
              {employee.manager && (
                <div>
                  <p className="text-slate-500">Reports To</p>
                  <p className="font-medium">
                    {employee.manager.user
                      ? `${employee.manager.user.firstName} ${employee.manager.user.lastName}`
                      : `${employee.manager.firstName} ${employee.manager.lastName}`}
                  </p>
                </div>
              )}
              {employee.user && (
                <div>
                  <p className="text-slate-500">Account</p>
                  <p className="font-medium text-xs">{employee.user.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subordinates */}
          {employee.subordinates && employee.subordinates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Direct Reports ({employee.subordinates.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.subordinates.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {sub.user
                          ? `${sub.user.firstName} ${sub.user.lastName}`
                          : `${sub.firstName} ${sub.lastName}`}
                      </p>
                      <p className="text-slate-500">{sub.position}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/hr/employees/${sub.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Edit form or read-only details */}
        <div className="lg:col-span-2">
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Employee</CardTitle>
              </CardHeader>
              <CardContent>
                {updateError && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {updateError.message}
                  </div>
                )}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <Input {...register("position")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Controller
                        name="department"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v as Department)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(Department).map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                  {dept.charAt(0) + dept.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input {...register("phoneNumber")} />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input {...register("city")} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Address</Label>
                      <Input {...register("address")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Salary (optional)</Label>
                      <Input type="number" step="0.01" {...register("salary", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Annual Leave Days</Label>
                      <Input type="number" {...register("annualLeaveDays", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Remaining Leave (manual override)</Label>
                      <Input type="number" {...register("remainingLeave", { valueAsNumber: true })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Manager</Label>
                      <Controller
                        name="managerId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value ?? "NONE"}
                            onValueChange={(v) => field.onChange(v === "NONE" ? undefined : v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No manager" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">— No manager —</SelectItem>
                              {allEmployees.map((e) => (
                                <SelectItem key={e.id} value={e.id}>
                                  {e.firstName} {e.lastName} ({e.position})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updating}>
                      {updating ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
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
                    <p className="font-medium">{employee.address}, {employee.city}, {employee.country}</p>
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
                  Created {format(new Date(employee.createdAt), "dd MMM yyyy")} · Updated{" "}
                  {format(new Date(employee.updatedAt), "dd MMM yyyy")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
