import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useForm, useWatch } from "react-hook-form";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { GET_MY_EMPLOYEE_PROFILE_QUERY } from "@/graphql/mutations/employee.mutations";
import {
  CANCEL_LEAVE_REQUEST_MUTATION,
  CREATE_LEAVE_REQUEST_MUTATION,
  GET_MY_LEAVE_REQUESTS_QUERY,
} from "@/graphql/mutations/leave-request.mutations";
import type {
  LeaveRequestFormValues,
  MyEmployeeProfileQueryResult,
  MyLeaveRequestsQueryResult,
} from "@/types/hr.types";

function calculateLeaveDays(start: string, end: string) {
  if (!start || !end) return 0;

  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function useLeaveRequestsController() {
  const [showForm, setShowForm] = useState(false);
  const [leaveRequestToCancel, setLeaveRequestToCancel] = useState<
    string | null
  >(null);

  const form = useForm<LeaveRequestFormValues>({
    defaultValues: {
      leaveType: "",
      startDate: "",
      endDate: "",
      days: 0,
      reason: "",
    },
  });

  const startDate = useWatch({ control: form.control, name: "startDate" });
  const endDate = useWatch({ control: form.control, name: "endDate" });
  const days = useWatch({ control: form.control, name: "days" });

  const {
    data: leaveRequestsData,
    loading,
    error,
    refetch,
  } = useQuery<MyLeaveRequestsQueryResult>(GET_MY_LEAVE_REQUESTS_QUERY);
  const { data: profileData } = useQuery<MyEmployeeProfileQueryResult>(
    GET_MY_EMPLOYEE_PROFILE_QUERY,
  );

  const [createLeaveRequest, { loading: creating }] = useMutationWithToast(
    CREATE_LEAVE_REQUEST_MUTATION,
    {
      successMessage: "Leave request submitted",
      onCompleted: () => {
        setShowForm(false);
        form.reset();
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

  const submitLeaveRequest = async (values: LeaveRequestFormValues) => {
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

    void cancelLeaveRequest({
      variables: { leaveRequestId: leaveRequestToCancel },
    }).catch(() => {
      // toast already shown
    });
    setLeaveRequestToCancel(null);
  };

  const handleDateChange = (
    field: "startDate" | "endDate",
    value: string,
  ) => {
    const currentOther = field === "startDate" ? endDate : startDate;

    form.setValue(field, value, { shouldDirty: true });

    if (field === "startDate" && currentOther && value > currentOther) {
      form.setValue("endDate", value, { shouldDirty: true });
    }

    const nextStart = field === "startDate" ? value : startDate;
    const nextEnd = field === "endDate" ? value : endDate;

    if (nextStart && nextEnd) {
      form.setValue("days", calculateLeaveDays(nextStart, nextEnd), {
        shouldDirty: true,
      });
    }
  };

  return {
    confirmCancel,
    creating,
    days,
    employeeProfile: profileData?.myEmployeeProfile,
    endDate,
    error,
    form,
    handleDateChange,
    leaveRequestToCancel,
    leaveRequests: leaveRequestsData?.myLeaveRequests ?? [],
    loading,
    setLeaveRequestToCancel,
    setShowForm,
    showForm,
    startDate,
    submitLeaveRequest,
  };
}

export type LeaveRequestsController = ReturnType<
  typeof useLeaveRequestsController
>;
