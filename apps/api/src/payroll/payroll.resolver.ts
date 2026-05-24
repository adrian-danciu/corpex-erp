import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollPeriod } from './entities/payroll-period.entity';
import { PayrollLine } from './entities/payroll-line.entity';
import {
  GeneratePayrollInput,
  UpdatePayrollLineInput,
} from './dto/payroll.inputs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => PayrollPeriod)
export class PayrollResolver {
  constructor(private readonly payrollService: PayrollService) {}

  @Query(() => [PayrollPeriod], { name: 'payrollPeriods' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('payroll', 'read')
  async payrollPeriods(): Promise<PayrollPeriod[]> {
    return this.payrollService.findAll();
  }

  @Query(() => PayrollPeriod, { name: 'payrollPeriod' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('payroll', 'read')
  async payrollPeriod(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PayrollPeriod> {
    return this.payrollService.findOne(id);
  }

  @Mutation(() => PayrollPeriod)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('payroll', 'write')
  async generatePayroll(
    @Args('input') input: GeneratePayrollInput,
    @CurrentUser() user: User,
  ): Promise<PayrollPeriod> {
    return this.payrollService.generate(input, user.id);
  }

  @Mutation(() => PayrollLine)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('payroll', 'write')
  async updatePayrollLine(
    @Args('input') input: UpdatePayrollLineInput,
  ): Promise<PayrollLine> {
    return this.payrollService.updateLine(input);
  }

  @Mutation(() => PayrollPeriod)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('payroll', 'write')
  async approvePayroll(
    @Args('periodId', { type: () => ID }) periodId: string,
    @CurrentUser() user: User,
  ): Promise<PayrollPeriod> {
    return this.payrollService.approve(periodId, user.id);
  }

  @Mutation(() => PayrollPeriod)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('payroll', 'write')
  async markPayrollPaid(
    @Args('periodId', { type: () => ID }) periodId: string,
    @CurrentUser() user: User,
  ): Promise<PayrollPeriod> {
    return this.payrollService.markPaid(periodId, user.id);
  }

  @Mutation(() => PayrollPeriod)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('payroll', 'write')
  async deletePayrollPeriod(
    @Args('periodId', { type: () => ID }) periodId: string,
  ): Promise<PayrollPeriod> {
    return this.payrollService.remove(periodId);
  }
}
