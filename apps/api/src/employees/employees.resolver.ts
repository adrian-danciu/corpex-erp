import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';
import { LinkEmployeeUserInput } from './dto/link-employee-user.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { Department } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationInput } from '../common/dto/pagination.input';
import { PaginatedEmployee } from './dto/paginated-employee.dto';

@Resolver(() => Employee)
export class EmployeesResolver {
  constructor(private readonly employeesService: EmployeesService) {}

  @Mutation(() => Employee, { description: 'Create a new employee record' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'write')
  async createEmployee(
    @Args('createEmployeeInput') createEmployeeInput: CreateEmployeeInput,
  ): Promise<Employee> {
    return this.employeesService.create(createEmployeeInput);
  }

  @Query(() => PaginatedEmployee, {
    name: 'employees',
    description: 'Get all employees (paginated)',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
  async findAllEmployees(
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
  ): Promise<PaginatedEmployee> {
    const paginationInput = pagination || { skip: 0, take: 10 };
    return this.employeesService.findAll(paginationInput);
  }

  @Query(() => Employee, {
    name: 'employee',
    description: 'Get an employee by ID',
    nullable: true,
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
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
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'read')
  async findEmployeesByDepartment(
    @Args('department', { type: () => Department }) department: Department,
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
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'write')
  async updateEmployee(
    @Args('updateEmployeeInput') updateEmployeeInput: UpdateEmployeeInput,
  ): Promise<Employee> {
    return this.employeesService.update(updateEmployeeInput);
  }

  @Mutation(() => Employee, { description: 'Delete an employee record' })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'write')
  async removeEmployee(@Args('id') id: string): Promise<Employee> {
    return this.employeesService.remove(id);
  }

  @Mutation(() => Employee, {
    description: 'Link an existing employee to an existing user account',
  })
  @UseGuards(JwtAuthGuard, DepartmentGuard)
  @RequireModule('hr', 'write')
  async linkEmployeeToUser(
    @Args('linkEmployeeUserInput') linkEmployeeUserInput: LinkEmployeeUserInput,
  ): Promise<Employee> {
    const { employeeId, userId } = linkEmployeeUserInput;
    return this.employeesService.linkToUser(employeeId, userId);
  }
}
