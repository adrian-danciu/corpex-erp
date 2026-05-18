import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CompanySettings, LeaveStatus, LeaveType, PayrollStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeneratePayrollInput, UpdatePayrollLineInput } from './dto/payroll.inputs';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollLine } from './entities/payroll-line.entity';

type PayrollPeriodWithLines = Prisma.PayrollPeriodGetPayload<{
  include: {
    lines: { include: { employee: { include: { user: true } } } };
    createdBy: true;
    approvedBy: true;
    paidBy: true;
  };
}>;

type PayrollTaxSettings = Pick<
  CompanySettings,
  | 'payrollTaxCasRate'
  | 'payrollTaxCassRate'
  | 'payrollTaxIncomeRate'
  | 'payrollTaxCamRate'
  | 'payrollPersonalDeduction'
  | 'payrollTaxRuleVersion'
>;

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PayrollPeriod[]> {
    const periods = await this.prisma.payrollPeriod.findMany({
      include: {
        lines: true,
        createdBy: true,
        approvedBy: true,
        paidBy: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return periods.map((period) => this.withTotals(period));
  }

  async findOne(id: string): Promise<PayrollPeriod> {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        lines: {
          include: { employee: { include: { user: true } } },
          orderBy: { employee: { lastName: 'asc' } },
        },
        createdBy: true,
        approvedBy: true,
        paidBy: true,
      },
    });

    if (!period) {
      throw new NotFoundException(`Payroll period ${id} not found`);
    }

    return this.withTotals(period);
  }

  async generate(input: GeneratePayrollInput, userId: string): Promise<PayrollPeriod> {
    this.validatePeriod(input.year, input.month);

    const existing = await this.prisma.payrollPeriod.findUnique({
      where: { year_month: { year: input.year, month: input.month } },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `Payroll for ${input.month}/${input.year} already exists`,
      );
    }

    const employees = await this.prisma.employee.findMany({
      where: { salary: { gt: 0 } },
      include: { user: true },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    if (!employees.length) {
      throw new BadRequestException('No employees with gross salary found');
    }

    const range = this.monthRange(input.year, input.month);
    const taxSettings = await this.getTaxSettings();
    const userIds = employees
      .map((employee) => employee.userId)
      .filter((id): id is string => Boolean(id));

    const unpaidLeaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: userIds },
        leaveType: LeaveType.UNPAID,
        status: LeaveStatus.APPROVED,
        startDate: { lte: range.end },
        endDate: { gte: range.start },
      },
    });

    const unpaidByUser = new Map<string, number>();
    for (const leave of unpaidLeaves) {
      const overlapDays = this.overlapDays(
        leave.startDate,
        leave.endDate,
        range.start,
        range.end,
      );
      unpaidByUser.set(
        leave.employeeId,
        (unpaidByUser.get(leave.employeeId) ?? 0) + overlapDays,
      );
    }

    const period = await this.prisma.payrollPeriod.create({
      data: {
        year: input.year,
        month: input.month,
        currency: input.currency || 'EUR',
        notes: input.notes?.trim() || null,
        createdById: userId,
        lines: {
          create: employees.map((employee) => {
            const grossSalary = employee.salary;
            const unpaidLeaveDays = employee.userId
              ? unpaidByUser.get(employee.userId) ?? 0
              : 0;
            const dailyRate = grossSalary / range.daysInMonth;
            const unpaidLeaveDeduction = this.round(dailyRate * unpaidLeaveDays);
            const payrollAmounts = this.calculateLine({
              grossSalary,
              bonus: 0,
              manualDeductions: 0,
              unpaidLeaveDeduction,
              isContractor: employee.isContractor,
              taxSettings,
            });
            return {
              employeeId: employee.id,
              grossSalary,
              unpaidLeaveDays,
              unpaidLeaveDeduction,
              ...payrollAmounts,
            };
          }),
        },
      },
      include: {
        lines: { include: { employee: { include: { user: true } } } },
        createdBy: true,
        approvedBy: true,
        paidBy: true,
      },
    });

    return this.withTotals(period);
  }

  async updateLine(input: UpdatePayrollLineInput): Promise<PayrollLine> {
    const line = await this.prisma.payrollLine.findUnique({
      where: { id: input.lineId },
      include: { period: true, employee: true },
    });
    if (!line) {
      throw new NotFoundException(`Payroll line ${input.lineId} not found`);
    }
    if (line.period.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Only draft payroll lines can be edited');
    }

    const bonus = input.bonus ?? line.bonus;
    const manualDeductions = input.manualDeductions ?? line.manualDeductions;
    const payrollAmounts = this.calculateLine({
      grossSalary: line.grossSalary,
      bonus,
      manualDeductions,
      unpaidLeaveDeduction: line.unpaidLeaveDeduction,
      isContractor: line.employee.isContractor,
      taxSettings: {
        payrollTaxCasRate: line.casRate,
        payrollTaxCassRate: line.cassRate,
        payrollTaxIncomeRate: line.incomeTaxRate,
        payrollTaxCamRate: line.camRate,
        payrollPersonalDeduction: 0,
        payrollTaxRuleVersion: line.taxRuleVersion,
      },
    });

    return this.prisma.payrollLine.update({
      where: { id: input.lineId },
      data: {
        bonus,
        manualDeductions,
        ...payrollAmounts,
        notes: input.notes ?? undefined,
      },
      include: { employee: { include: { user: true } } },
    });
  }

  async approve(periodId: string, userId: string): Promise<PayrollPeriod> {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      select: { status: true },
    });
    if (!period) throw new NotFoundException(`Payroll period ${periodId} not found`);
    if (period.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Only draft payroll can be approved');
    }

    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: PayrollStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    return this.findOne(periodId);
  }

  async markPaid(periodId: string, userId: string): Promise<PayrollPeriod> {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      select: { status: true },
    });
    if (!period) throw new NotFoundException(`Payroll period ${periodId} not found`);
    if (period.status !== PayrollStatus.APPROVED) {
      throw new BadRequestException('Only approved payroll can be marked as paid');
    }

    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: {
        status: PayrollStatus.PAID,
        paidById: userId,
        paidAt: new Date(),
      },
    });

    return this.findOne(periodId);
  }

  async remove(periodId: string): Promise<PayrollPeriod> {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        lines: {
          include: { employee: { include: { user: true } } },
          orderBy: { employee: { lastName: 'asc' } },
        },
        createdBy: true,
        approvedBy: true,
        paidBy: true,
      },
    });
    if (!period) throw new NotFoundException(`Payroll period ${periodId} not found`);
    if (period.status !== PayrollStatus.DRAFT) {
      throw new BadRequestException('Only draft payroll can be deleted');
    }

    await this.prisma.payrollPeriod.delete({
      where: { id: periodId },
    });

    return this.withTotals(period);
  }

  private withTotals<T extends { lines?: Array<{
    grossSalary: number;
    bonus: number;
    manualDeductions: number;
    casAmount: number;
    cassAmount: number;
    incomeTaxAmount: number;
    netAmount: number;
    employerTotalCost: number;
  }> }>(period: T): T & {
    totalGross: number;
    totalBonus: number;
    totalCas: number;
    totalCass: number;
    totalIncomeTax: number;
    totalManualDeductions: number;
    totalNet: number;
    totalEmployerCost: number;
    employeeCount: number;
  } {
    const lines = period.lines ?? [];
    return {
      ...period,
      totalGross: this.sum(lines, 'grossSalary'),
      totalBonus: this.sum(lines, 'bonus'),
      totalCas: this.sum(lines, 'casAmount'),
      totalCass: this.sum(lines, 'cassAmount'),
      totalIncomeTax: this.sum(lines, 'incomeTaxAmount'),
      totalManualDeductions: this.sum(lines, 'manualDeductions'),
      totalNet: this.sum(lines, 'netAmount'),
      totalEmployerCost: this.sum(lines, 'employerTotalCost'),
      employeeCount: lines.length,
    };
  }

  private sum(lines: Array<Record<string, number>>, key: string): number {
    return Number(lines.reduce((total, line) => total + (line[key] ?? 0), 0).toFixed(2));
  }

  private validatePeriod(year: number, month: number) {
    if (year < 2000 || year > 2100) {
      throw new BadRequestException('Year must be between 2000 and 2100');
    }
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
  }

  private monthRange(year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { start, end, daysInMonth: end.getUTCDate() };
  }

  private overlapDays(start: Date, end: Date, windowStart: Date, windowEnd: Date) {
    const from = start > windowStart ? start : windowStart;
    const to = end < windowEnd ? end : windowEnd;
    if (from > to) return 0;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.floor((to.getTime() - from.getTime()) / msPerDay) + 1;
  }

  private async getTaxSettings(): Promise<PayrollTaxSettings> {
    return this.prisma.companySettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
      select: {
        payrollTaxCasRate: true,
        payrollTaxCassRate: true,
        payrollTaxIncomeRate: true,
        payrollTaxCamRate: true,
        payrollPersonalDeduction: true,
        payrollTaxRuleVersion: true,
      },
    });
  }

  private calculateLine(input: {
    grossSalary: number;
    bonus: number;
    manualDeductions: number;
    unpaidLeaveDeduction: number;
    isContractor: boolean;
    taxSettings: PayrollTaxSettings;
  }) {
    const { taxSettings } = input;
    const taxableGross = this.round(
      Math.max(input.grossSalary + input.bonus - input.unpaidLeaveDeduction, 0),
    );
    const casAmount = input.isContractor
      ? 0
      : this.percent(taxableGross, taxSettings.payrollTaxCasRate);
    const cassAmount = input.isContractor
      ? 0
      : this.percent(taxableGross, taxSettings.payrollTaxCassRate);
    const incomeTaxBase = Math.max(
      taxableGross -
        casAmount -
        cassAmount -
        taxSettings.payrollPersonalDeduction,
      0,
    );
    const incomeTaxAmount = input.isContractor
      ? 0
      : this.percent(incomeTaxBase, taxSettings.payrollTaxIncomeRate);
    const camAmount = input.isContractor
      ? 0
      : this.percent(taxableGross, taxSettings.payrollTaxCamRate);
    const employerTotalCost = this.round(taxableGross + camAmount);
    const netAmount = this.round(
      taxableGross -
        casAmount -
        cassAmount -
        incomeTaxAmount -
        input.manualDeductions,
    );

    return {
      taxableGross,
      casRate: input.isContractor ? 0 : taxSettings.payrollTaxCasRate,
      casAmount,
      cassRate: input.isContractor ? 0 : taxSettings.payrollTaxCassRate,
      cassAmount,
      incomeTaxRate: input.isContractor ? 0 : taxSettings.payrollTaxIncomeRate,
      incomeTaxAmount,
      camRate: input.isContractor ? 0 : taxSettings.payrollTaxCamRate,
      camAmount,
      employerTotalCost,
      taxRuleVersion: taxSettings.payrollTaxRuleVersion,
      netAmount,
    };
  }

  private percent(amount: number, rate: number) {
    return this.round((amount * rate) / 100);
  }

  private round(value: number) {
    return Number(value.toFixed(2));
  }
}
