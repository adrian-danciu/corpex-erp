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
    reports: 'fleet',
    dashboard: true,
  },
  [Department.MANAGEMENT]: {
    hr: 'read',
    leaveRequests: 'write',
    leaveApprovals: true,
    finance: 'read',
    stock: 'read',
    fleet: 'read',
    reports: 'all',
    dashboard: true,
  },
  [Department.IT]: {
    hr: 'none',
    leaveRequests: 'write',
    leaveApprovals: false,
    finance: 'none',
    stock: 'none',
    fleet: 'none',
    reports: 'none',
    dashboard: true,
  },
};

export type ModuleKey = keyof ModulePermissions;
