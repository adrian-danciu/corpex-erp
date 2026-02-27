import { UseGuards } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportingService } from './reporting.service';
import {
  DashboardMetrics,
  FinanceAgingBucket,
  HrLeaveSummary,
} from './reporting.types';

@Resolver()
export class ReportingResolver {
  constructor(private readonly reportingService: ReportingService) {}

  @Query(() => DashboardMetrics, {
    name: 'dashboardMetrics',
    description: 'High-level KPIs for the main dashboard',
  })
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'MANAGER', 'FINANCE', 'HR')
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.reportingService.getDashboardMetrics();
  }

  @Query(() => [HrLeaveSummary], {
    name: 'hrLeaveSummary',
    description: 'Aggregated leave requests by status',
  })
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'MANAGER', 'HR')
  async getHrLeaveSummary(): Promise<HrLeaveSummary[]> {
    return this.reportingService.getHrLeaveSummary();
  }

  @Query(() => [FinanceAgingBucket], {
    name: 'financeAgingSummary',
    description: 'Aging analysis for outstanding invoice amounts',
  })
  @UseGuards(JwtAuthGuard)
  @Roles('ADMIN', 'MANAGER', 'FINANCE')
  async getFinanceAgingSummary(): Promise<FinanceAgingBucket[]> {
    return this.reportingService.getFinanceAgingSummary();
  }
}
