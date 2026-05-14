import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleExpenseInput } from './dto/create-vehicle-expense.input';
import { VehicleExpense } from './entities/vehicle-expense.entity';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVehicleExpenseInput): Promise<VehicleExpense> {
    return this.prisma.vehicleExpense.create({ data: input });
  }

  async findByVehicle(vehicleId: string): Promise<VehicleExpense[]> {
    return this.prisma.vehicleExpense.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });
  }

  async remove(id: string): Promise<VehicleExpense> {
    const expense = await this.prisma.vehicleExpense.findUnique({
      where: { id },
    });
    if (!expense)
      throw new NotFoundException(`Expense with ID ${id} not found`);
    return this.prisma.vehicleExpense.delete({ where: { id } });
  }
}
