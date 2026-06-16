import { Controller, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ContractType,
  Department,
  type Employee,
  type UpdateEmployeeInput,
} from "@/types/hr.types";

interface EmployeeEditFormProps {
  allEmployees: Employee[];
  form: UseFormReturn<UpdateEmployeeInput>;
  onCancel: () => void;
  onSubmit: (values: UpdateEmployeeInput) => Promise<void>;
  updating: boolean;
}

export function EmployeeEditForm({
  allEmployees,
  form,
  onCancel,
  onSubmit,
  updating,
}: EmployeeEditFormProps) {
  const { register, handleSubmit, control } = form;

  return (
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
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      field.onChange(value as Department)
                    }
                  >
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
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      field.onChange(value as ContractType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contract type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ContractType.FULL_TIME}>
                        Full time
                      </SelectItem>
                      <SelectItem value={ContractType.PART_TIME}>
                        Part time
                      </SelectItem>
                      <SelectItem value={ContractType.INTERNSHIP}>
                        Internship
                      </SelectItem>
                      <SelectItem value={ContractType.FIXED_TERM}>
                        Fixed term
                      </SelectItem>
                      <SelectItem value={ContractType.TEMPORARY}>
                        Temporary
                      </SelectItem>
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
                    onCheckedChange={(checked) =>
                      field.onChange(Boolean(checked))
                    }
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
                  min: {
                    value: 0.01,
                    message: "Gross salary must be greater than 0",
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Annual Leave Days</Label>
              <Input
                type="number"
                {...register("annualLeaveDays", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Remaining Leave (manual override)</Label>
              <Input
                type="number"
                {...register("remainingLeave", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Controller
                name="managerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "NONE"}
                    onValueChange={(value) =>
                      field.onChange(value === "NONE" ? undefined : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">— No manager —</SelectItem>
                      {allEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} (
                          {employee.position})
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
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
