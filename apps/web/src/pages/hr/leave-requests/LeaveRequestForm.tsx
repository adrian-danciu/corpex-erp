import { Controller, type UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  LeaveType,
  type LeaveRequestFormValues,
} from "@/types/hr.types";

interface LeaveRequestFormProps {
  creating: boolean;
  days: number;
  endDate: string;
  form: UseFormReturn<LeaveRequestFormValues>;
  onCancel: () => void;
  onDateChange: (field: "startDate" | "endDate", value: string) => void;
  onSubmit: (values: LeaveRequestFormValues) => Promise<void>;
  startDate: string;
}

export function LeaveRequestForm({
  creating,
  days,
  endDate,
  form,
  onCancel,
  onDateChange,
  onSubmit,
  startDate,
}: LeaveRequestFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Leave Request</CardTitle>
        <CardDescription>Submit a new leave request for approval</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type *</Label>
              <Controller
                name="leaveType"
                control={control}
                rules={{ required: "Leave type is required" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as LeaveType)
                    }
                  >
                    <SelectTrigger
                      className={errors.leaveType ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LeaveType.ANNUAL}>
                        Annual Leave
                      </SelectItem>
                      <SelectItem value={LeaveType.MEDICAL}>
                        Medical Leave
                      </SelectItem>
                      <SelectItem value={LeaveType.UNPAID}>
                        Unpaid Leave
                      </SelectItem>
                      <SelectItem value={LeaveType.MATERNITY}>
                        Maternity Leave
                      </SelectItem>
                      <SelectItem value={LeaveType.PATERNITY}>
                        Paternity Leave
                      </SelectItem>
                      <SelectItem value={LeaveType.STUDY}>
                        Study Leave
                      </SelectItem>
                      <SelectItem value={LeaveType.SPECIAL}>
                        Special Leave
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.leaveType && (
                <p className="text-sm text-red-500">
                  {errors.leaveType.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="days">Days Requested</Label>
              <Input
                id="days"
                type="number"
                value={days}
                readOnly
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) =>
                  onDateChange("startDate", event.target.value)
                }
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) =>
                  onDateChange("endDate", event.target.value)
                }
                min={startDate}
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <Input
                  id="reason"
                  placeholder="Enter reason for leave"
                  {...field}
                />
              )}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={creating}>
              {creating ? "Submitting..." : "Submit Request"}
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
