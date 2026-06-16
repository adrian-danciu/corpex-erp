import { Calendar, CheckCircle, Clock, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { LeaveStatus, type LeaveRequest } from "@/types/hr.types";

function getStatusIcon(status: LeaveStatus) {
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
}

function getStatusColor(status: LeaveStatus) {
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
}

interface LeaveRequestListProps {
  leaveRequests: LeaveRequest[];
  onCancelRequest: (requestId: string) => void;
}

export function LeaveRequestList({
  leaveRequests,
  onCancelRequest,
}: LeaveRequestListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Leave Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {leaveRequests.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-lg font-medium">No leave requests found</p>
            <p className="text-sm mt-1">
              Submit your first leave request to get started
            </p>
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
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}
                      >
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(request.startDate)} -{" "}
                          {formatDate(request.endDate)}
                        </span>
                        <span className="font-medium">
                          ({request.days} days)
                        </span>
                      </div>
                      {request.reason && (
                        <p className="text-slate-700">
                          <span className="font-medium">Reason:</span>{" "}
                          {request.reason}
                        </p>
                      )}
                      {request.comments && (
                        <p className="text-slate-700">
                          <span className="font-medium">Comments:</span>{" "}
                          {request.comments}
                        </p>
                      )}
                      {request.approver && (
                        <p className="text-slate-600">
                          <span className="font-medium">Reviewed by:</span>{" "}
                          {request.approver.firstName}{" "}
                          {request.approver.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  {(request.status === LeaveStatus.PENDING ||
                    request.status === LeaveStatus.APPROVED) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancelRequest(request.id)}
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
  );
}
