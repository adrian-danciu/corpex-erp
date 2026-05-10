import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CREATE_EMPLOYEE_MUTATION, GET_EMPLOYEES_QUERY } from "@/graphql/mutations/employee.mutations";
import { ContractType, Department, type CreateEmployeeInput, type Employee } from "@/types/hr.types";
import { PaginatedResult } from "@/types/pagination.types";

export default function EmployeeCreatePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    defaultValues: {
      firstName: "",
      lastName: "",
      personalId: "",
      dateOfBirth: "",
      phoneNumber: "",
      address: "",
      city: "",
      country: "Romania",
      position: "",
      department: Department.HR,
      contractType: ContractType.FULL_TIME,
      employmentDate: "",
      contractEndDate: "",
      salary: undefined,
      annualLeaveDays: 21,
      managerId: undefined,
    },
  });

  const { data: employeesData } = useQuery<{ employees: PaginatedResult<Employee> }>(GET_EMPLOYEES_QUERY, {
    variables: { pagination: { skip: 0, take: 500 } },
  });
  const allEmployees = employeesData?.employees.items ?? [];

  const [createEmployee, { loading }] = useMutationWithToast(
    CREATE_EMPLOYEE_MUTATION,
    {
      successMessage: "Employee created",
      onCompleted: () => navigate("/hr/employees"),
    },
  );

  const onSubmit = async (values: CreateEmployeeInput) => {
    try {
      await createEmployee({
        variables: {
          createEmployeeInput: {
            ...values,
            contractEndDate: values.contractEndDate || undefined,
            salary: values.salary ?? undefined,
            managerId: values.managerId || undefined,
            country: values.country || "Romania",
          },
        },
      });
    } catch {
      // toast already shown
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Add Employee</h1>
          <p className="text-slate-600 mt-1">
            Create a new employee or contractor record. IT can later generate an application account.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/hr/employees")}>
          Back to Employees
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Identity */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register("firstName", { required: "First name is required" })}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register("lastName", { required: "Last name is required" })}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalId">CNP *</Label>
                <Input
                  id="personalId"
                  {...register("personalId", { required: "CNP is required" })}
                  className={errors.personalId ? "border-red-500" : ""}
                />
                {errors.personalId && (
                  <p className="text-sm text-red-500">{errors.personalId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register("dateOfBirth", { required: "Date of birth is required" })}
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                />
                {errors.dateOfBirth && (
                  <p className="text-sm text-red-500">{errors.dateOfBirth.message}</p>
                )}
              </div>
            </div>

            {/* Contact */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber", { required: "Phone number is required" })}
                  className={errors.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  {...register("address", { required: "Address is required" })}
                  className={errors.address ? "border-red-500" : ""}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city", { required: "City is required" })}
                  className={errors.city ? "border-red-500" : ""}
                />
                {errors.city && (
                  <p className="text-sm text-red-500">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...register("country")} />
              </div>
            </div>

            {/* Job */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  {...register("position", { required: "Position is required" })}
                  className={errors.position ? "border-red-500" : ""}
                />
                {errors.position && (
                  <p className="text-sm text-red-500">{errors.position.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Department *</Label>
                <Controller
                  name="department"
                  control={control}
                  rules={{ required: "Department is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(v) => field.onChange(v as Department)}>
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
                {errors.department && (
                  <p className="text-sm text-red-500">{errors.department.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Contract Type *</Label>
                <Controller
                  name="contractType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as ContractType)}
                    >
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

              <div className="space-y-2">
                <Label htmlFor="employmentDate">Employment Date *</Label>
                <Input
                  id="employmentDate"
                  type="date"
                  {...register("employmentDate", { required: "Employment date is required" })}
                  className={errors.employmentDate ? "border-red-500" : ""}
                />
                {errors.employmentDate && (
                  <p className="text-sm text-red-500">{errors.employmentDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractEndDate">Contract End Date</Label>
                <Input id="contractEndDate" type="date" {...register("contractEndDate")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary (optional)</Label>
                <Input id="salary" type="number" step="0.01" {...register("salary", { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualLeaveDays">Annual Leave Days</Label>
                <Input
                  id="annualLeaveDays"
                  type="number"
                  {...register("annualLeaveDays", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-2">
                <Label>Manager (optional)</Label>
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

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/hr/employees")}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Employee"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
