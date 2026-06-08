import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { ReportingService } from './reporting.service';
import {
  DashboardMetrics,
  EmployeeReportRow,
  FinanceAgingBucket,
  FleetReportRow,
  HrLeaveSummary,
  StockReportRow,
} from './reporting.types';

@Resolver()
export class ReportingResolver {
  constructor(private readonly reportingService: ReportingService) {}

  @Query(() => DashboardMetrics, {
    name: 'dashboardMetrics',
    description: 'High-level KPIs for the main dashboard',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('dashboard', 'read')
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.reportingService.getDashboardMetrics();
  }

  @Query(() => [HrLeaveSummary], {
    name: 'hrLeaveSummary',
    description: 'Aggregated leave requests by status',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
  async getHrLeaveSummary(): Promise<HrLeaveSummary[]> {
    return this.reportingService.getHrLeaveSummary();
  }

  @Query(() => [FinanceAgingBucket], {
    name: 'financeAgingSummary',
    description: 'Aging analysis for outstanding client receivables',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'read')
  async getFinanceAgingSummary(): Promise<FinanceAgingBucket[]> {
    return this.reportingService.getFinanceAgingSummary();
  }

  @Query(() => [FinanceAgingBucket], {
    name: 'supplierAgingSummary',
    description: 'Aging analysis for outstanding supplier payables',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('finance', 'read')
  async getSupplierAgingSummary(): Promise<FinanceAgingBucket[]> {
    return this.reportingService.getSupplierAgingSummary();
  }

  @Query(() => [EmployeeReportRow], { name: 'employeeReport' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
  async getEmployeeReport(): Promise<EmployeeReportRow[]> {
    return this.reportingService.getEmployeeReport();
  }

  @Query(() => [StockReportRow], { name: 'stockReport' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('stock', 'read')
  async getStockReport(): Promise<StockReportRow[]> {
    return this.reportingService.getStockReport();
  }

  @Query(() => [FleetReportRow], { name: 'fleetReport' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'read')
  async getFleetReport(): Promise<FleetReportRow[]> {
    return this.reportingService.getFleetReport();
  }
}
