import { Department, UserRole } from "@/types/auth.types";
import type { User } from "@/types/auth.types";

export type AccessLevel = "none" | "read" | "write";
export type ReportScope = "none" | "hr" | "finance" | "stock" | "fleet" | "all";

export interface ModulePermissions {
  hr: AccessLevel;
  leaveRequests: AccessLevel;
  leaveApprovals: boolean;
  finance: AccessLevel;
  stock: AccessLevel;
  fleet: AccessLevel;
  projects: AccessLevel;
  reports: ReportScope;
  dashboard: boolean;
}

export const DEPARTMENT_PERMISSIONS: Record<Department, ModulePermissions> = {
  [Department.HR]: {
    hr: "write",
    leaveRequests: "write",
    leaveApprovals: true,
    finance: "none",
    stock: "none",
    fleet: "none",
    projects: "read",
    reports: "hr",
    dashboard: true,
  },
  [Department.FINANCE]: {
    hr: "none",
    leaveRequests: "write",
    leaveApprovals: false,
    finance: "write",
    stock: "none",
    fleet: "none",
    projects: "read",
    reports: "finance",
    dashboard: true,
  },
  [Department.WAREHOUSE]: {
    hr: "none",
    leaveRequests: "write",
    leaveApprovals: false,
    finance: "none",
    stock: "write",
    fleet: "none",
    projects: "read",
    reports: "stock",
    dashboard: true,
  },
  [Department.FLEET]: {
    hr: "none",
    leaveRequests: "write",
    leaveApprovals: false,
    finance: "none",
    stock: "none",
    fleet: "write",
    projects: "read",
    reports: "fleet",
    dashboard: true,
  },
  [Department.MANAGEMENT]: {
    hr: "read",
    leaveRequests: "write",
    leaveApprovals: true,
    finance: "read",
    stock: "read",
    fleet: "read",
    projects: "write",
    reports: "all",
    dashboard: true,
  },
  [Department.IT]: {
    hr: "none",
    leaveRequests: "write",
    leaveApprovals: false,
    finance: "none",
    stock: "none",
    fleet: "none",
    projects: "none",
    reports: "none",
    dashboard: true,
  },
};

const ADMIN_PERMISSIONS: ModulePermissions = {
  hr: "write",
  leaveRequests: "write",
  leaveApprovals: true,
  finance: "write",
  stock: "write",
  fleet: "write",
  projects: "write",
  reports: "all",
  dashboard: true,
};

export function getPermissions(user: User | null): ModulePermissions | null {
  if (!user) return null;
  if (user.role === UserRole.ADMIN) return ADMIN_PERMISSIONS;
  if (!user.department) return null;
  return DEPARTMENT_PERMISSIONS[user.department as Department] ?? null;
}

export function canAccess(
  user: User | null,
  module: keyof ModulePermissions,
  required: AccessLevel | boolean = "read",
): boolean {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  const perms = getPermissions(user);
  if (!perms) return false;
  const val = perms[module];
  if (typeof val === "boolean") return val;
  if (required === "write") return val === "write";
  return val !== "none";
}
