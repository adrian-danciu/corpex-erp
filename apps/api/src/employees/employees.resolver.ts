import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Employee)
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

  @Mutation(() => Employee, { description: 'Create a new employee record' })
  @UseGuards(JwtAuthGuard)
  async createEmployee(
    @Args('createEmployeeInput') createEmployeeInput: CreateEmployeeInput,
  ): Promise<Employee> {
    return this.employeesService.create(createEmployeeInput);
  }

  @Query(() => [Employee], {
    name: 'employees',
    description: 'Get all employees',
  })
  @UseGuards(JwtAuthGuard)
  async findAllEmployees(): Promise<Employee[]> {
    return this.employeesService.findAll();
  }

  @Query(() => Employee, {
    name: 'employee',
    description: 'Get an employee by ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  async findOneEmployee(@Args('id') id: string): Promise<Employee | null> {
    return this.employeesService.findOne(id);
  }

  @Query(() => Employee, {
    name: 'employeeByUserId',
    description: 'Get an employee by user ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  async findEmployeeByUserId(
    @Args('userId') userId: string,
  ): Promise<Employee | null> {
    return this.employeesService.findByUserId(userId);
  }

  @Query(() => Employee, {
    name: 'myEmployeeProfile',
    description: 'Get current user employee profile',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard)
  async getMyEmployeeProfile(
    @CurrentUser() user: User,
  ): Promise<Employee | null> {
    return this.employeesService.findByUserId(user.id);
  }

  @Query(() => [Employee], {
    name: 'employeesByDepartment',
    description: 'Get employees by department',
  })
  @UseGuards(JwtAuthGuard)
  async findEmployeesByDepartment(
    @Args('department') department: string,
  ): Promise<Employee[]> {
    return this.employeesService.findByDepartment(department);
  }

  @Query(() => [Employee], {
    name: 'mySubordinates',
    description: 'Get subordinates of current user (if manager)',
  })
  @UseGuards(JwtAuthGuard)
  async getMySubordinates(@CurrentUser() user: User): Promise<Employee[]> {
    const myEmployee = await this.employeesService.findByUserId(user.id);
    if (!myEmployee) {
      return [];
    }
    return this.employeesService.findSubordinates(myEmployee.id);
  }

  @Mutation(() => Employee, { description: 'Update an employee record' })
  @UseGuards(JwtAuthGuard)
  async updateEmployee(
    @Args('updateEmployeeInput') updateEmployeeInput: UpdateEmployeeInput,
  ): Promise<Employee> {
    return this.employeesService.update(updateEmployeeInput);
  }

  @Mutation(() => Employee, { description: 'Delete an employee record' })
  @UseGuards(JwtAuthGuard)
  async removeEmployee(@Args('id') id: string): Promise<Employee> {
    return this.employeesService.remove(id);
  }
}
