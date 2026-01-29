import { gql } from "@apollo/client";

export const CREATE_LEAVE_REQUEST_MUTATION = gql`
  mutation CreateLeaveRequest($createLeaveRequestInput: CreateLeaveRequestInput!) {
    createLeaveRequest(createLeaveRequestInput: $createLeaveRequestInput) {
      id
      employeeId
      employee {
        id
        firstName
        lastName
        email
      }
      leaveType
      startDate
      endDate
      days
      reason
      status
      approverId
      approver {
        id
        firstName
        lastName
      }
      comments
      approvedAt
      createdAt
      updatedAt
    }
  }
`;

export const APPROVE_OR_REJECT_LEAVE_REQUEST_MUTATION = gql`
  mutation ApproveOrRejectLeaveRequest($approveLeaveRequestInput: ApproveLeaveRequestInput!) {
    approveOrRejectLeaveRequest(approveLeaveRequestInput: $approveLeaveRequestInput) {
      id
      employeeId
      employee {
        id
        firstName
        lastName
        email
      }
      leaveType
      startDate
      endDate
      days
      reason
      status
      approverId
      approver {
        id
        firstName
        lastName
      }
      comments
      approvedAt
      createdAt
      updatedAt
    }
  }
`;

export const CANCEL_LEAVE_REQUEST_MUTATION = gql`
  mutation CancelLeaveRequest($leaveRequestId: String!) {
    cancelLeaveRequest(leaveRequestId: $leaveRequestId) {
      id
      status
    }
  }
`;

export const GET_LEAVE_REQUESTS_QUERY = gql`
  query GetLeaveRequests {
    leaveRequests {
      id
      employeeId
      employee {
        id
        firstName
        lastName
        email
      }
      leaveType
      startDate
      endDate
      days
      reason
      status
      approverId
      approver {
        id
        firstName
        lastName
      }
      comments
      approvedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_LEAVE_REQUESTS_QUERY = gql`
  query GetMyLeaveRequests {
    myLeaveRequests {
      id
      employeeId
      employee {
        id
        firstName
        lastName
        email
      }
      leaveType
      startDate
      endDate
      days
      reason
      status
      approverId
      approver {
        id
        firstName
        lastName
      }
      comments
      approvedAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_PENDING_LEAVE_REQUESTS_FOR_MANAGER_QUERY = gql`
  query GetPendingLeaveRequestsForManager {
    pendingLeaveRequestsForManager {
      id
      employeeId
      employee {
        id
        firstName
        lastName
        email
      }
      leaveType
      startDate
      endDate
      days
      reason
      status
      createdAt
      updatedAt
    }
  }
`;

export const GET_LEAVE_REQUEST_QUERY = gql`
  query GetLeaveRequest($id: String!) {
    leaveRequest(id: $id) {
      id
      employeeId
      employee {
        id
        firstName
        lastName
        email
      }
      leaveType
      startDate
      endDate
      days
      reason
      status
      approverId
      approver {
        id
        firstName
        lastName
      }
      comments
      approvedAt
      createdAt
      updatedAt
    }
  }
`;
