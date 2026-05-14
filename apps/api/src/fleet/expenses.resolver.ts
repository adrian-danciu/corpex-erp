import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { VehicleExpense } from './entities/vehicle-expense.entity';
import { CreateVehicleExpenseInput } from './dto/create-vehicle-expense.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';

@Resolver(() => VehicleExpense)
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  @Query(() => [VehicleExpense], { name: 'vehicleExpenses' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'read')
  async findByVehicle(
    @Args('vehicleId') vehicleId: string,
  ): Promise<VehicleExpense[]> {
    return this.expensesService.findByVehicle(vehicleId);
  }

  @Mutation(() => VehicleExpense)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async createVehicleExpense(
    @Args('createVehicleExpenseInput') input: CreateVehicleExpenseInput,
  ): Promise<VehicleExpense> {
    return this.expensesService.create(input);
  }

  @Mutation(() => VehicleExpense)
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('fleet', 'write')
  async deleteVehicleExpense(@Args('id') id: string): Promise<VehicleExpense> {
    return this.expensesService.remove(id);
  }
}
