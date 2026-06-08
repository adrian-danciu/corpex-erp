import type { Employee } from "./hr.types";
import type { User } from "./auth.types";

export enum PayrollStatus {
  DRAFT = "DRAFT",
  APPROVED = "APPROVED",
  PAID = "PAID",
}

export interface PayrollLine {
  id: string;
  periodId: string;
  employeeId: string;
  employee?: Employee | null;
  grossSalary: number;
  bonus: number;
  manualDeductions: number;
  unpaidLeaveDays: number;
  unpaidLeaveDeduction: number;
  taxableGross: number;
  casRate: number;
  casAmount: number;
  cassRate: number;
  cassAmount: number;
  incomeTaxRate: number;
  incomeTaxAmount: number;
  camRate: number;
  camAmount: number;
  employerTotalCost: number;
  taxRuleVersion: string;
  netAmount: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriod {
  id: string;
  year: number;
  month: number;
  status: PayrollStatus;
  currency: string;
  notes?: string | null;
  createdById: string;
  createdBy?: User | null;
  approvedById?: string | null;
  approvedBy?: User | null;
  approvedAt?: string | null;
  paidById?: string | null;
  paidBy?: User | null;
  paidAt?: string | null;
  lines?: PayrollLine[];
  totalGross: number;
  totalBonus: number;
  totalCas: number;
  totalCass: number;
  totalIncomeTax: number;
  totalManualDeductions: number;
  totalNet: number;
  totalEmployerCost: number;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriodsQueryResult {
  payrollPeriods: PayrollPeriod[];
}

export interface PayrollPeriodQueryResult {
  payrollPeriod: PayrollPeriod;
}
