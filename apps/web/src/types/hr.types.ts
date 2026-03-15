import type { User } from "./auth.types";
import { Department } from "./auth.types";
export { Department };

export enum ContractType {
  FULL_TIME = "FULL_TIME",
  PART_TIME = "PART_TIME",
  INTERNSHIP = "INTERNSHIP",
  FIXED_TERM = "FIXED_TERM",
  TEMPORARY = "TEMPORARY",
}

export enum LeaveType {
  ANNUAL = "ANNUAL",
  MEDICAL = "MEDICAL",
  UNPAID = "UNPAID",
  MATERNITY = "MATERNITY",
  PATERNITY = "PATERNITY",
  STUDY = "STUDY",
  SPECIAL = "SPECIAL",
}

export enum LeaveStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export interface Employee {
  id: string;
  userId?: string | null;
  user?: User | null;
  firstName: string;
  lastName: string;
  personalId: string; // CNP
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  city: string;
  country: string;
  position: string;
  department: Department;
  contractType: ContractType;
  employmentDate: string;
  contractEndDate?: string | null;
  salary?: number | null;
  annualLeaveDays: number;
  remainingLeave: number;
  managerId?: string | null;
  manager?: Employee | null;
  subordinates?: Employee[];
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: User;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string | null;
  status: LeaveStatus;
  approverId?: string | null;
  approver?: User | null;
  comments?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  userId?: string;
  firstName: string;
  lastName: string;
  personalId: string;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  city: string;
  country?: string;
  position: string;
  department: Department;
  contractType: ContractType;
  employmentDate: string;
  contractEndDate?: string;
  salary?: number;
  annualLeaveDays?: number;
  managerId?: string;
}

export interface UpdateEmployeeInput {
  id: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  position?: string;
  department?: Department;
  salary?: number;
  annualLeaveDays?: number;
  remainingLeave?: number;
  managerId?: string;
}

export interface CreateLeaveRequestInput {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
}

export interface ApproveLeaveRequestInput {
  leaveRequestId: string;
  approved: boolean;
  comments?: string;
}
