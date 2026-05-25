import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import {
  GET_MY_LEAVE_REQUESTS_QUERY,
  CREATE_LEAVE_REQUEST_MUTATION,
  CANCEL_LEAVE_REQUEST_MUTATION,
} from "@/graphql/mutations/leave-request.mutations";
import { GET_MY_EMPLOYEE_PROFILE_QUERY } from "@/graphql/mutations/employee.mutations";
import type {
  LeaveRequest,
  LeaveRequestFormValues,
  MyEmployeeProfileQueryResult,
  MyLeaveRequestsQueryResult,
} from "@/types/hr.types";
import { LeaveType, LeaveStatus } from "@/types/hr.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/ui/page-loading";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, X, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function LeaveRequestsPage() {
  const [showForm, setShowForm] = useState(false);
  const [leaveRequestToCancel, setLeaveRequestToCancel] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestFormValues>({
    defaultValues: {
      leaveType: "",
      startDate: "",
      endDate: "",
      days: 0,
      reason: "",
    },
  });

  const watchStartDate = useWatch({ control, name: "startDate" });
  const watchEndDate = useWatch({ control, name: "endDate" });
  const watchDays = useWatch({ control, name: "days" });

  const { data: leaveRequestsData, loading, error, refetch } =
    useQuery<MyLeaveRequestsQueryResult>(GET_MY_LEAVE_REQUESTS_QUERY);
  const { data: profileData } =
    useQuery<MyEmployeeProfileQueryResult>(GET_MY_EMPLOYEE_PROFILE_QUERY);

  const [createLeaveRequest, { loading: creating }] = useMutationWithToast(
    CREATE_LEAVE_REQUEST_MUTATION,
    {
      successMessage: "Leave request submitted",
      onCompleted: () => {
        setShowForm(false);
        reset();
        void refetch();
      },
    },
  );

  const [cancelLeaveRequest] = useMutationWithToast(
    CANCEL_LEAVE_REQUEST_MUTATION,
    {
      successMessage: "Leave request cancelled",
      onCompleted: () => {
        void refetch();
      },
    },
  );

  const onSubmit = async (values: LeaveRequestFormValues) => {
    try {
      await createLeaveRequest({
        variables: {
          createLeaveRequestInput: {
            leaveType: values.leaveType,
            startDate: values.startDate,
            endDate: values.endDate,
            days: values.days,
            reason: values.reason || undefined,
          },
        },
      });
    } catch {
      // toast already shown
    }
  };

  const confirmCancel = () => {
    if (!leaveRequestToCancel) return;
    void cancelLeaveRequest({ variables: { leaveRequestId: leaveRequestToCancel } }).catch(() => {
      // toast already shown
    });
    setLeaveRequestToCancel(null);
  };

  // Calculate days between dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const currentOther = field === "startDate" ? watchEndDate : watchStartDate;

    setValue(field, value, { shouldDirty: true });

    if (field === "startDate" && currentOther && value > currentOther) {
      // Ensure end date is not before start date
      setValue("endDate", value, { shouldDirty: true });
    }

    const start = field === "startDate" ? value : watchStartDate;
    const end = field === "endDate" ? value : watchEndDate;

    if (start && end) {
      const days = calculateDays(start, end);
      setValue("days", days, { shouldDirty: true });
    }
  };

  if (loading) {
    return <PageLoading message="Loading leave requests..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading leave requests: {error.message}</div>
      </div>
    );
  }

  const leaveRequests: LeaveRequest[] = leaveRequestsData?.myLeaveRequests || [];
  const employeeProfile = profileData?.myEmployeeProfile;

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case LeaveStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />;
      case LeaveStatus.CANCELLED:
        return <X className="h-4 w-4 text-slate-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.APPROVED:
        return "bg-green-50 text-green-700";
      case LeaveStatus.REJECTED:
        return "bg-red-50 text-red-700";
      case LeaveStatus.CANCELLED:
        return "bg-slate-50 text-slate-700";
      default:
        return "bg-yellow-50 text-yellow-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leave Requests</h1>
          <p className="text-slate-600 mt-1">View and manage your leave requests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Request
            </>
          )}
        </Button>
      </div>

      {/* Leave Balance Card */}
      {employeeProfile && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-blue-700">Remaining Days</p>
                <p className="text-3xl font-bold text-blue-900">{employeeProfile.remainingLeave}</p>
              </div>
              <div className="text-blue-700">/</div>
              <div>
                <p className="text-sm text-blue-700">Annual Allowance</p>
                <p className="text-3xl font-bold text-blue-900">{employeeProfile.annualLeaveDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New Request Form */}
      {showForm && (
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
                        onValueChange={(value) => field.onChange(value as LeaveType)}
                      >
                        <SelectTrigger className={errors.leaveType ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={LeaveType.ANNUAL}>Annual Leave</SelectItem>
                          <SelectItem value={LeaveType.MEDICAL}>Medical Leave</SelectItem>
                          <SelectItem value={LeaveType.UNPAID}>Unpaid Leave</SelectItem>
                          <SelectItem value={LeaveType.MATERNITY}>Maternity Leave</SelectItem>
                          <SelectItem value={LeaveType.PATERNITY}>Paternity Leave</SelectItem>
                          <SelectItem value={LeaveType.STUDY}>Study Leave</SelectItem>
                          <SelectItem value={LeaveType.SPECIAL}>Special Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.leaveType && (
                    <p className="text-sm text-red-500">{errors.leaveType.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Days Requested</Label>
                  <Input
                    id="days"
                    type="number"
                    value={watchDays}
                    readOnly
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={watchStartDate}
                    onChange={(e) => handleDateChange("startDate", e.target.value)}
                    className={errors.startDate ? "border-red-500" : ""}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-500">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={watchEndDate}
                    onChange={(e) => handleDateChange("endDate", e.target.value)}
                    min={watchStartDate}
                    className={errors.endDate ? "border-red-500" : ""}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-500">{errors.endDate.message}</p>
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
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leave Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No leave requests found</p>
              <p className="text-sm mt-1">Submit your first leave request to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900">
                          {request.leaveType.replace("_", " ")}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(request.startDate), "MMM dd, yyyy")} -{" "}
                            {format(new Date(request.endDate), "MMM dd, yyyy")}
                          </span>
                          <span className="font-medium">({request.days} days)</span>
                        </div>
                        {request.reason && (
                          <p className="text-slate-700">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        )}
                        {request.comments && (
                          <p className="text-slate-700">
                            <span className="font-medium">Comments:</span> {request.comments}
                          </p>
                        )}
                        {request.approver && (
                          <p className="text-slate-600">
                            <span className="font-medium">Reviewed by:</span>{" "}
                            {request.approver.firstName} {request.approver.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    {(request.status === LeaveStatus.PENDING || request.status === LeaveStatus.APPROVED) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLeaveRequestToCancel(request.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <ConfirmationDialog
        open={Boolean(leaveRequestToCancel)}
        onOpenChange={(open) => !open && setLeaveRequestToCancel(null)}
        title="Cancel leave request?"
        description="This will cancel the selected leave request and remove it from the approval flow."
        confirmLabel="Cancel request"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
