import { Plus, X } from "lucide-react";
import { InlineError } from "@/components/common/InlineError";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { PageLoading } from "@/components/ui/page-loading";
import { LeaveBalanceCard } from "./leave-requests/LeaveBalanceCard";
import { LeaveRequestForm } from "./leave-requests/LeaveRequestForm";
import { LeaveRequestList } from "./leave-requests/LeaveRequestList";
import { useLeaveRequestsController } from "./leave-requests/useLeaveRequestsController";

export default function LeaveRequestsPage() {
  const leaveRequests = useLeaveRequestsController();

  if (leaveRequests.loading) {
    return <PageLoading message="Loading leave requests..." />;
  }

  if (leaveRequests.error) {
    return (
      <div className="py-24">
        <InlineError>
          Error loading leave requests: {leaveRequests.error.message}
        </InlineError>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Leave Requests</h1>
          <p className="text-slate-600 mt-1">
            View and manage your leave requests
          </p>
        </div>
        <Button
          onClick={() => leaveRequests.setShowForm(!leaveRequests.showForm)}
          className="gap-2"
        >
          {leaveRequests.showForm ? (
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

      {leaveRequests.employeeProfile && (
        <LeaveBalanceCard employeeProfile={leaveRequests.employeeProfile} />
      )}

      {leaveRequests.showForm && (
        <LeaveRequestForm
          creating={leaveRequests.creating}
          days={leaveRequests.days}
          endDate={leaveRequests.endDate}
          form={leaveRequests.form}
          onCancel={() => leaveRequests.setShowForm(false)}
          onDateChange={leaveRequests.handleDateChange}
          onSubmit={leaveRequests.submitLeaveRequest}
          startDate={leaveRequests.startDate}
        />
      )}

      <LeaveRequestList
        leaveRequests={leaveRequests.leaveRequests}
        onCancelRequest={leaveRequests.setLeaveRequestToCancel}
      />

      <ConfirmationDialog
        open={Boolean(leaveRequests.leaveRequestToCancel)}
        onOpenChange={(open) =>
          !open && leaveRequests.setLeaveRequestToCancel(null)
        }
        title="Cancel leave request?"
        description="This will cancel the selected leave request and remove it from the approval flow."
        confirmLabel="Cancel request"
        onConfirm={leaveRequests.confirmCancel}
      />
    </div>
  );
}
