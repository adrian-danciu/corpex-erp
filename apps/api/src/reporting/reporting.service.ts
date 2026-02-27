import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardMetrics,
  FinanceAgingBucket,
  HrLeaveSummary,
} from './reporting.types';
import { InvoiceStatus, LeaveStatus } from '@prisma/client';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const [
      totalUsers,
      totalEmployees,
      pendingLeaveRequests,
      approvedLeaveThisMonth,
      invoiceStats,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.employee.count(),
      this.prisma.leaveRequest.count({
        where: { status: LeaveStatus.PENDING },
      }),
      this.prisma.leaveRequest.count({
        where: {
          status: LeaveStatus.APPROVED,
          approvedAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      this.prisma.invoice.aggregate({
        _count: { id: true },
        _sum: { total: true, paidAmount: true },
        where: {
          status: {
            in: [
              InvoiceStatus.DRAFT,
              InvoiceStatus.SENT,
              InvoiceStatus.PAID,
              InvoiceStatus.PARTIALLY_PAID,
              InvoiceStatus.OVERDUE,
            ],
          },
        },
      }),
    ]);

    const overdueInvoices = await this.prisma.invoice.count({
      where: { status: InvoiceStatus.OVERDUE },
    });

    return {
      totalUsers,
      totalEmployees,
      pendingLeaveRequests,
      approvedLeaveThisMonth,
      totalInvoices: invoiceStats._count.id ?? 0,
      overdueInvoices,
      totalInvoicedAmount: invoiceStats._sum.total ?? 0,
      totalPaidAmount: invoiceStats._sum.paidAmount ?? 0,
    };
  }

  async getHrLeaveSummary(): Promise<HrLeaveSummary[]> {
    const grouped = await this.prisma.leaveRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    return grouped.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));
  }

  async getFinanceAgingSummary(): Promise<FinanceAgingBucket[]> {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: {
          in: [
            InvoiceStatus.SENT,
            InvoiceStatus.PARTIALLY_PAID,
            InvoiceStatus.OVERDUE,
          ],
        },
      },
      select: {
        id: true,
        dueDate: true,
        total: true,
        paidAmount: true,
      },
    });

    const buckets: Record<string, { amount: number; invoiceCount: number }> = {
      '0-30': { amount: 0, invoiceCount: 0 },
      '31-60': { amount: 0, invoiceCount: 0 },
      '61-90': { amount: 0, invoiceCount: 0 },
      '90+': { amount: 0, invoiceCount: 0 },
    };

    for (const invoice of invoices) {
      const outstanding = invoice.total - invoice.paidAmount;
      if (outstanding <= 0) continue;

      const diffMs = now.getTime() - invoice.dueDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let bucketKey: keyof typeof buckets;
      if (diffDays <= 30) bucketKey = '0-30';
      else if (diffDays <= 60) bucketKey = '31-60';
      else if (diffDays <= 90) bucketKey = '61-90';
      else bucketKey = '90+';

      buckets[bucketKey].amount += outstanding;
      buckets[bucketKey].invoiceCount += 1;
    }

    return Object.entries(buckets).map(([label, value]) => ({
      label,
      amount: value.amount,
      invoiceCount: value.invoiceCount,
    }));
  }
}
