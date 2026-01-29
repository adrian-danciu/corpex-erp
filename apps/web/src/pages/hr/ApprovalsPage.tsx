import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  GET_PENDING_LEAVE_REQUESTS_FOR_MANAGER_QUERY,
  APPROVE_OR_REJECT_LEAVE_REQUEST_MUTATION,
} from "@/graphql/mutations/leave-request.mutations";
import { GET_MY_SUBORDINATES_QUERY } from "@/graphql/mutations/employee.mutations";
import type { LeaveRequest, Employee } from "@/types/hr.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CheckCircle, XCircle, Users } from "lucide-react";
import { format } from "date-fns";

export default function ApprovalsPage() {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [comments, setComments] = useState("");

  const { data: requestsData, loading, error, refetch } = useQuery(
    GET_PENDING_LEAVE_REQUESTS_FOR_MANAGER_QUERY
  );
  const { data: subordinatesData } = useQuery(GET_MY_SUBORDINATES_QUERY);

  const [approveOrReject, { loading: processing }] = useMutation(
    APPROVE_OR_REJECT_LEAVE_REQUEST_MUTATION,
    {
      onCompleted: () => {
        setSelectedRequest(null);
        setComments("");
        refetch();
      },
    }
  );

  const handleApproveOrReject = (leaveRequestId: string, approved: boolean) => {
    approveOrReject({
      variables: {
        approveLeaveRequestInput: {
          leaveRequestId,
          approved,
          comments: comments || undefined,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading approvals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Error loading approvals: {error.message}</div>
      </div>
    );
  }

  const pendingRequests: LeaveRequest[] = requestsData?.pendingLeaveRequestsForManager || [];
  const subordinates: Employee[] = subordinatesData?.mySubordinates || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Leave Approvals</h1>
        <p className="text-slate-600 mt-1">Review and approve leave requests from your team</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subordinates.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
          <CardDescription>Review and respond to leave requests from your team</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No pending approvals</p>
              <p className="text-sm mt-1">All leave requests have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Request Info */}
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-slate-900">
                            {request.employee.firstName} {request.employee.lastName}
                          </h3>
                          <p className="text-sm text-slate-600">{request.employee.email}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-blue-50 text-blue-700">
                          {request.leaveType.replace("_", " ")}
                        </span>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(request.startDate), "MMM dd, yyyy")} -{" "}
                            {format(new Date(request.endDate), "MMM dd, yyyy")}
                          </span>
                          <span className="font-medium text-slate-900">({request.days} days)</span>
                        </div>
                        {request.reason && (
                          <p className="text-slate-700">
                            <span className="font-medium">Reason:</span> {request.reason}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          Requested on {format(new Date(request.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                        </p>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {selectedRequest === request.id ? (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="space-y-2">
                          <Label htmlFor="comments">Comments (Optional)</Label>
                          <Input
                            id="comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add comments for the employee"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveOrReject(request.id, true)}
                            disabled={processing}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                            {processing ? "Approving..." : "Approve"}
                          </Button>
                          <Button
                            onClick={() => handleApproveOrReject(request.id, false)}
                            disabled={processing}
                            variant="destructive"
                            className="gap-2"
                          >
                            <XCircle className="h-4 w-4" />
                            {processing ? "Rejecting..." : "Reject"}
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedRequest(null);
                              setComments("");
                            }}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          onClick={() => setSelectedRequest(request.id)}
                          variant="outline"
                          className="gap-2"
                        >
                          Review Request
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Members */}
      {subordinates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
            <CardDescription>Employees reporting to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subordinates.map((employee) => (
                <div key={employee.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {employee.user.firstName} {employee.user.lastName}
                      </p>
                      <p className="text-sm text-slate-600">{employee.position}</p>
                      <p className="text-xs text-slate-500 mt-1">{employee.department}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm">
                    <p className="text-slate-600">
                      Leave Balance:{" "}
                      <span className="font-medium text-slate-900">
                        {employee.remainingLeave} days
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
