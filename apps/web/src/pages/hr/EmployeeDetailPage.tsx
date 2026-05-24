import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { useForm, Controller } from "react-hook-form";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  GET_EMPLOYEE_QUERY,
  GET_EMPLOYEES_QUERY,
  UPDATE_EMPLOYEE_MUTATION,
  DELETE_EMPLOYEE_MUTATION,
} from "@/graphql/mutations/employee.mutations";
import { GENERATE_EMPLOYEE_ACCOUNT_MUTATION } from "@/graphql/mutations/user.mutations";
import { ContractType, Department } from "@/types/hr.types";
import { PageLoading } from "@/components/ui/page-loading";
import type { Employee, UpdateEmployeeInput } from "@/types/hr.types";
import { PaginatedResult } from "@/types/pagination.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Trash2, Users, Calendar, AlertCircle, KeyRound } from "lucide-react";
import { format } from "date-fns";
import { EmployeeDocumentsPanel } from "@/components/hr/EmployeeDocumentsPanel";

interface EmployeeAccountGenerationResult {
  employeeId: string;
  employeeName: string | null;
  email: string | null;
  initialPassword: string | null;
  created: boolean;
  message: string;
}

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [generatedAccount, setGeneratedAccount] =
    useState<EmployeeAccountGenerationResult | null>(null);

  const { data, loading, error, refetch } = useQuery<{ employee: Employee | null }>(GET_EMPLOYEE_QUERY, {
    variables: { id },
    skip: !id,
  });

  const { data: employeesData } = useQuery<{ employees: PaginatedResult<Employee> }>(GET_EMPLOYEES_QUERY, {
    variables: { pagination: { skip: 0, take: 500 } },
  });

  const [updateEmployee, { loading: updating }] = useMutationWithToast(
    UPDATE_EMPLOYEE_MUTATION,
    {
      successMessage: "Employee updated",
      onCompleted: () => {
        setEditing(false);
        void refetch();
      },
    },
  );

  const [deleteEmployee, { loading: deleting }] = useMutationWithToast(
    DELETE_EMPLOYEE_MUTATION,
    {
      successMessage: "Employee deleted",
      onCompleted: () => navigate("/hr/employees"),
    },
  );

  const [generateEmployeeAccount, { loading: generatingAccount }] =
    useMutationWithToast<{
      generateEmployeeAccount: EmployeeAccountGenerationResult;
    }>(GENERATE_EMPLOYEE_ACCOUNT_MUTATION, {
      successMessage: "Account created",
      onCompleted: (result) => {
        setGeneratedAccount(result.generateEmployeeAccount);
        void refetch();
      },
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
          contractType: employee.contractType,
          isContractor: employee.isContractor,
          salary: employee.salary,
          annualLeaveDays: employee.annualLeaveDays,
          remainingLeave: employee.remainingLeave,
          managerId: employee.managerId ?? undefined,
        }
      : { id: id ?? "" },
  });

  const onSubmit = async (values: UpdateEmployeeInput) => {
    try {
      await updateEmployee({
        variables: {
          updateEmployeeInput: {
            ...values,
            salary: values.salary,
            managerId: values.managerId || undefined,
          },
        },
      });
    } catch {
      // toast already shown
    }
  };

  const confirmDelete = () => {
    void deleteEmployee({ variables: { id } });
    setDeleteDialogOpen(false);
  };

  const handleGenerateAccount = () => {
    if (!employee) return;
    void generateEmployeeAccount({ variables: { employeeId: employee.id } });
  };

  if (loading) {
    return <PageLoading message="Loading employee..." />;
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
                onClick={() => setDeleteDialogOpen(true)}
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
                <p className="text-slate-500">Payroll Type</p>
                <p className="font-medium">{employee.isContractor ? "B2B contractor" : "Employment contract"}</p>
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
              <div>
                <p className="text-slate-500">Gross Salary</p>
                <p className="font-medium">
                  {employee.salary.toLocaleString("ro-RO", { style: "currency", currency: "EUR" })}
                </p>
              </div>
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
              {!employee.user && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                  <p className="font-medium text-amber-900">No account linked</p>
                  <p className="mt-1 text-xs text-amber-800">
                    Generate an account from this employee record when they need
                    application access.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={handleGenerateAccount}
                    disabled={generatingAccount}
                  >
                    <KeyRound className="h-4 w-4" />
                    {generatingAccount ? "Creating..." : "Create account"}
                  </Button>
                </div>
              )}
              {generatedAccount?.created && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3">
                  <p className="font-medium text-green-900">
                    Temporary credentials
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-green-900">
                    <p>
                      Email:{" "}
                      <span className="font-mono">{generatedAccount.email}</span>
                    </p>
                    <p>
                      Password:{" "}
                      <span className="font-mono">
                        {generatedAccount.initialPassword}
                      </span>
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-green-800">
                    The employee will be asked to change this password on first
                    sign-in.
                  </p>
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

          <EmployeeDocumentsPanel employeeId={employee.id} />
        </div>

        {/* Right column - Edit form or read-only details */}
        <div className="lg:col-span-2">
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Employee</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <Label>Contract Type</Label>
                      <Controller
                        name="contractType"
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v as ContractType)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select contract type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={ContractType.FULL_TIME}>Full time</SelectItem>
                              <SelectItem value={ContractType.PART_TIME}>Part time</SelectItem>
                              <SelectItem value={ContractType.INTERNSHIP}>Internship</SelectItem>
                              <SelectItem value={ContractType.FIXED_TERM}>Fixed term</SelectItem>
                              <SelectItem value={ContractType.TEMPORARY}>Temporary</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-3 rounded-md border p-3">
                      <Controller
                        name="isContractor"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id="employee-is-contractor"
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                          />
                        )}
                      />
                      <Label htmlFor="employee-is-contractor" className="cursor-pointer">
                        B2B contractor
                      </Label>
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
                      <Label>Gross Salary (EUR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register("salary", {
                          required: "Gross salary is required",
                          valueAsNumber: true,
                          min: { value: 0.01, message: "Gross salary must be greater than 0" },
                        })}
                      />
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
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete employee?"
        description={`This permanently deletes ${employee.firstName} ${employee.lastName}'s employee record. This action cannot be undone.`}
        confirmLabel="Delete employee"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
