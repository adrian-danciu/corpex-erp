import type { Partner } from "./finance.types";
import type { Product, Warehouse } from "./stock.types";
import type { Vehicle } from "./fleet.types";

export enum ProjectStatus {
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum ProjectMemberRole {
  PROJECT_MANAGER = "PROJECT_MANAGER",
  MEMBER = "MEMBER",
}

export enum ProjectMaterialStatus {
  REQUESTED = "REQUESTED",
  RESERVED = "RESERVED",
  PARTIALLY_ISSUED = "PARTIALLY_ISSUED",
  FULLY_ISSUED = "FULLY_ISSUED",
  CANCELLED = "CANCELLED",
}

export enum ProjectServiceStatus {
  PLANNED = "PLANNED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export enum ProjectTaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
  BLOCKED = "BLOCKED",
}

export enum ProjectTaskPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export enum ProjectFeedKind {
  AUTO = "AUTO",
  POST = "POST",
}

export interface ProjectUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectMemberRole;
  joinedAt: string;
  leftAt?: string | null;
  user?: ProjectUser;
}

export interface ProjectMaterial {
  id: string;
  projectId: string;
  productId: string;
  warehouseId: string;
  requestedQty: number;
  reservedQty: number;
  issuedQty: number;
  unitCost: number;
  status: ProjectMaterialStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
  warehouse?: Warehouse;
}

export interface ProjectService {
  id: string;
  projectId: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  status: ProjectServiceStatus;
  billable: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectVehicleAssignment {
  id: string;
  projectId: string;
  vehicleId: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  createdAt: string;
  vehicle?: Vehicle;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  assigneeId?: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  dueDate?: string | null;
  completedAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: ProjectUser | null;
  createdBy?: ProjectUser;
  comments?: ProjectTaskComment[];
}

export interface ProjectTaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author?: ProjectUser | null;
}

export interface ProjectFeedEntry {
  id: string;
  projectId: string;
  kind: ProjectFeedKind;
  authorId?: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  deletedAt?: string | null;
  author?: ProjectUser | null;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  partnerId: string;
  partner?: Partner;
  status: ProjectStatus;
  budget: number;
  currency: string;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  notes?: string | null;
  createdById: string;
  createdBy?: ProjectUser;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  materials?: ProjectMaterial[];
  services?: ProjectService[];
  vehicles?: ProjectVehicleAssignment[];
  tasks?: ProjectTask[];
  feed?: ProjectFeedEntry[];
}

export interface ProjectCostRollup {
  budget: number;
  materialsCost: number;
  servicesCost: number;
  vehicleCost: number;
  totalActual: number;
  remaining: number;
  currency: string;
}

export interface InvoiceLineDraft {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  source: string;
  sourceType: "PROJECT_MATERIAL" | "PROJECT_SERVICE" | "VEHICLE_EXPENSE";
  sourceId: string;
  amount: number;
  vatAmount: number;
  total: number;
}
