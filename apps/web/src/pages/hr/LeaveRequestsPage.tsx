import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_MY_LEAVE_REQUESTS_QUERY,
  CREATE_LEAVE_REQUEST_MUTATION,
  CANCEL_LEAVE_REQUEST_MUTATION,
} from "@/graphql/mutations/leave-request.mutations";
import { GET_MY_EMPLOYEE_PROFILE_QUERY } from "@/graphql/mutations/employee.mutations";
import type { LeaveRequest } from "@/types/hr.types";
import { LeaveType, LeaveStatus } from "@/types/hr.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [formData, setFormData] = useState({
    leaveType: "" as LeaveType,
    startDate: "",
    endDate: "",
    days: 0,
    reason: "",
  });

  const { data: leaveRequestsData, loading, error, refetch } = useQuery<{ myLeaveRequests: LeaveRequest[] }>(GET_MY_LEAVE_REQUESTS_QUERY);
  const { data: profileData } = useQuery<{ myEmployeeProfile: { remainingLeave: number } | null }>(GET_MY_EMPLOYEE_PROFILE_QUERY);

  const [createLeaveRequest, { loading: creating }] = useMutation(CREATE_LEAVE_REQUEST_MUTATION, {
    onCompleted: () => {
      setShowForm(false);
      setFormData({
        leaveType: "" as LeaveType,
        startDate: "",
        endDate: "",
        days: 0,
        reason: "",
      });
      refetch();
    },
  });

  const [cancelLeaveRequest] = useMutation(CANCEL_LEAVE_REQUEST_MUTATION, {
    onCompleted: () => {
      refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLeaveRequest({
      variables: {
        createLeaveRequestInput: formData,
      },
    });
  };

  const handleCancel = (leaveRequestId: string) => {
    if (confirm("Are you sure you want to cancel this leave request?")) {
      cancelLeaveRequest({
        variables: { leaveRequestId },
      });
    }
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
    const newFormData = { ...formData, [field]: value };
    if (newFormData.startDate && newFormData.endDate) {
      newFormData.days = calculateDays(newFormData.startDate, newFormData.endDate);
    }
    setFormData(newFormData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading leave requests...</div>
      </div>
    );
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type *</Label>
                  <Select
                    value={formData.leaveType}
                    onValueChange={(value) => setFormData({ ...formData, leaveType: value as LeaveType })}
                    required
                  >
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="days">Days Requested</Label>
                  <Input
                    id="days"
                    type="number"
                    value={formData.days}
                    readOnly
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleDateChange("startDate", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleDateChange("endDate", e.target.value)}
                    min={formData.startDate}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter reason for leave"
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
                        onClick={() => handleCancel(request.id)}
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
    </div>
  );
}
