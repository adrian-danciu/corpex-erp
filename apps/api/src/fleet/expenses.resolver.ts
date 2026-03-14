import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { VehicleExpense } from './entities/vehicle-expense.entity';
import { CreateVehicleExpenseInput } from './dto/create-vehicle-expense.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => VehicleExpense)
export class ExpensesResolver {
  constructor(private readonly expensesService: ExpensesService) {}

  @Query(() => [VehicleExpense], { name: 'vehicleExpenses' })
  @UseGuards(JwtAuthGuard)
  async findByVehicle(@Args('vehicleId') vehicleId: string): Promise<VehicleExpense[]> {
    return this.expensesService.findByVehicle(vehicleId);
  }

  @Mutation(() => VehicleExpense)
  @UseGuards(JwtAuthGuard)
  async createVehicleExpense(
    @Args('createVehicleExpenseInput') input: CreateVehicleExpenseInput,
  ): Promise<VehicleExpense> {
    return this.expensesService.create(input);
  }

  @Mutation(() => VehicleExpense)
  @UseGuards(JwtAuthGuard)
  async deleteVehicleExpense(@Args('id') id: string): Promise<VehicleExpense> {
    return this.expensesService.remove(id);
  }
}
