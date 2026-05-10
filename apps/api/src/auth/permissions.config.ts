import { Department } from '@prisma/client';

export type AccessLevel = 'none' | 'read' | 'write';
export type ReportScope = 'none' | 'hr' | 'finance' | 'stock' | 'fleet' | 'all';

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
    hr: 'write',
    leaveRequests: 'write',
    leaveApprovals: true,
    finance: 'none',
    stock: 'none',
    fleet: 'none',
    projects: 'read',
    reports: 'hr',
    dashboard: true,
  },
  [Department.FINANCE]: {
    hr: 'none',
    leaveRequests: 'write',
    leaveApprovals: false,
    finance: 'write',
    stock: 'none',
    fleet: 'none',
    projects: 'read',
    reports: 'finance',
    dashboard: true,
  },
  [Department.WAREHOUSE]: {
    hr: 'none',
    leaveRequests: 'write',
    leaveApprovals: false,
    finance: 'none',
    stock: 'write',
    fleet: 'none',
    projects: 'read',
    reports: 'stock',
    dashboard: true,
  },
  [Department.FLEET]: {
    hr: 'none',
    leaveRequests: 'write',
    leaveApprovals: false,
    finance: 'none',
    stock: 'none',
    fleet: 'write',
    projects: 'read',
    reports: 'fleet',
    dashboard: true,
  },
  [Department.MANAGEMENT]: {
    hr: 'write',
    leaveRequests: 'write',
    leaveApprovals: true,
    finance: 'write',
    stock: 'write',
    fleet: 'write',
    projects: 'write',
    reports: 'all',
    dashboard: true,
  },
  [Department.IT]: {
    hr: 'none',
    leaveRequests: 'write',
    leaveApprovals: false,
    finance: 'none',
    stock: 'read',
    fleet: 'none',
    projects: 'read',
    reports: 'none',
    dashboard: true,
  },
};

export type ModuleKey = keyof ModulePermissions;
