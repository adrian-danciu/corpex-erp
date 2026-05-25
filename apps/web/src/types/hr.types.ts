import type { User } from "./auth.types";
import { Department } from "./auth.types";
import type { PaginatedResult } from "./pagination.types";
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

export enum EmployeeDocumentType {
  ID_CARD = "ID_CARD",
  CONTRACT = "CONTRACT",
  MEDICAL_CERTIFICATE = "MEDICAL_CERTIFICATE",
  DIPLOMA = "DIPLOMA",
  TRAINING = "TRAINING",
  OTHER = "OTHER",
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
  isContractor: boolean;
  employmentDate: string;
  contractEndDate?: string | null;
  salary: number;
  annualLeaveDays: number;
  remainingLeave: number;
  managerId?: string | null;
  manager?: Employee | null;
  subordinates?: Employee[];
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employee?: Employee | null;
  type: EmployeeDocumentType;
  title: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  expiryDate?: string | null;
  notes?: string | null;
  uploadedById: string;
  uploadedBy?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee: User;
  /** Resolver field: the employee's direct manager (per Employee.managerId), if any. */
  directManager?: User | null;
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
  isContractor?: boolean;
  employmentDate: string;
  contractEndDate?: string;
  salary: number;
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
  contractType?: ContractType;
  isContractor?: boolean;
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

export interface EmployeesQueryResult {
  employees: PaginatedResult<Employee>;
}

export interface EmployeeQueryResult {
  employee: Employee | null;
}

export interface MyEmployeeProfile {
  remainingLeave: number;
  annualLeaveDays: number;
}

export interface MyEmployeeProfileQueryResult {
  myEmployeeProfile: MyEmployeeProfile | null;
}

export interface MySubordinatesQueryResult {
  mySubordinates: Employee[];
}

export interface MyLeaveRequestsQueryResult {
  myLeaveRequests: LeaveRequest[];
}

export interface AllPendingLeaveRequestsQueryResult {
  allPendingLeaveRequests: LeaveRequest[];
}

export interface ApproveOrRejectLeaveRequestMutationResult {
  approveOrRejectLeaveRequest: LeaveRequest;
}

export interface LeaveRequestFormValues {
  leaveType: LeaveType | "";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

export interface EmployeeDocumentsQueryResult {
  employeeDocuments: EmployeeDocument[];
}

export interface EmployeeDocumentUploadPayload {
  url: string;
  filename: string;
  size: number;
  mime: string;
}
