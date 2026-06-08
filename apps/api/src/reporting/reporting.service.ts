import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardMetrics,
  EmployeeReportRow,
  FinanceAgingBucket,
  FleetReportRow,
  HrLeaveSummary,
  StockReportRow,
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
      clientInvoiceStats,
      supplierInvoiceStats,
      overdueInvoices,
      overdueSupplierInvoices,
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
          isClientInvoice: true,
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
      this.prisma.invoice.aggregate({
        _count: { id: true },
        _sum: { total: true, paidAmount: true },
        where: {
          isClientInvoice: false,
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
      this.prisma.invoice.count({
        where: {
          isClientInvoice: true,
          status: InvoiceStatus.OVERDUE,
        },
      }),
      this.prisma.invoice.count({
        where: {
          isClientInvoice: false,
          status: InvoiceStatus.OVERDUE,
        },
      }),
    ]);

    return {
      totalUsers,
      totalEmployees,
      pendingLeaveRequests,
      approvedLeaveThisMonth,
      totalInvoices: clientInvoiceStats._count.id ?? 0,
      overdueInvoices,
      totalInvoicedAmount: clientInvoiceStats._sum.total ?? 0,
      totalPaidAmount: clientInvoiceStats._sum.paidAmount ?? 0,
      totalSupplierInvoices: supplierInvoiceStats._count.id ?? 0,
      overdueSupplierInvoices,
      totalPayableAmount: supplierInvoiceStats._sum.total ?? 0,
      totalSupplierPaidAmount: supplierInvoiceStats._sum.paidAmount ?? 0,
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
    return this.getInvoiceAgingSummary(true);
  }

  async getSupplierAgingSummary(): Promise<FinanceAgingBucket[]> {
    return this.getInvoiceAgingSummary(false);
  }

  private async getInvoiceAgingSummary(
    isClientInvoice: boolean,
  ): Promise<FinanceAgingBucket[]> {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        isClientInvoice,
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

  async getEmployeeReport(): Promise<EmployeeReportRow[]> {
    const employees = await this.prisma.employee.findMany({
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
        contractType: true,
        employmentDate: true,
        remainingLeave: true,
        annualLeaveDays: true,
      },
    });

    return employees.map((e) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      position: e.position,
      department: e.department,
      contractType: e.contractType,
      employmentDate: e.employmentDate,
      remainingLeave: e.remainingLeave,
      annualLeaveDays: e.annualLeaveDays,
    }));
  }

  async getStockReport(): Promise<StockReportRow[]> {
    const stockBalances = await this.prisma.productStock.findMany({
      where: { quantity: { gt: 0 } },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { name: true } },
      },
      orderBy: [
        { product: { name: 'asc' } },
        { warehouse: { name: 'asc' } },
      ],
    });

    return stockBalances.map((stock) => ({
      productId: stock.product.id,
      productName: stock.product.name,
      sku: stock.product.sku,
      warehouseName: stock.warehouse.name,
      quantity: stock.quantity,
    }));
  }

  async getFleetReport(): Promise<FleetReportRow[]> {
    const vehicles = await this.prisma.vehicle.findMany({
      orderBy: { plateNumber: 'asc' },
      include: {
        documents: {
          orderBy: { expiryDate: 'asc' },
          take: 1,
          select: { expiryDate: true, type: true },
        },
      },
    });

    return vehicles.map((v) => ({
      id: v.id,
      plateNumber: v.plateNumber,
      brand: v.brand,
      model: v.model,
      year: v.year,
      status: v.status,
      nearestDocumentExpiry: v.documents[0]?.expiryDate ?? null,
      nearestDocumentType: v.documents[0]?.type ?? null,
    }));
  }
}
