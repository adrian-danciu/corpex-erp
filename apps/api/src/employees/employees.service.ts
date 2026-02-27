import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeInput } from './dto/create-employee.input';
import { UpdateEmployeeInput } from './dto/update-employee.input';
import { Employee } from './entities/employee.entity';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new employee record
   * @param createEmployeeInput - Employee data
   * @returns Created employee
   */
  async create(createEmployeeInput: CreateEmployeeInput): Promise<Employee> {
    // Check if employee with this personalId already exists
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { personalId: createEmployeeInput.personalId },
    });

    if (existingEmployee) {
      throw new ConflictException(
        `Employee with CNP ${createEmployeeInput.personalId} already exists`,
      );
    }

    // If userId is provided, ensure the user does not already have an employee record
    if (createEmployeeInput.userId) {
      const existingUserEmployee = await this.prisma.employee.findUnique({
        where: { userId: createEmployeeInput.userId },
      });

      if (existingUserEmployee) {
        throw new ConflictException(`User already has an employee record`);
      }
    }

    // Create the employee
    const employee = await this.prisma.employee.create({
      data: {
        userId: createEmployeeInput.userId ?? null,
        firstName: createEmployeeInput.firstName,
        lastName: createEmployeeInput.lastName,
        personalId: createEmployeeInput.personalId,
        dateOfBirth: createEmployeeInput.dateOfBirth,
        phoneNumber: createEmployeeInput.phoneNumber,
        address: createEmployeeInput.address,
        city: createEmployeeInput.city,
        country: createEmployeeInput.country,
        position: createEmployeeInput.position,
        department: createEmployeeInput.department,
        contractType: createEmployeeInput.contractType,
        employmentDate: createEmployeeInput.employmentDate,
        contractEndDate: createEmployeeInput.contractEndDate,
        salary: createEmployeeInput.salary,
        annualLeaveDays: createEmployeeInput.annualLeaveDays,
        remainingLeave: createEmployeeInput.annualLeaveDays, // Initialize with annual leave days
        managerId: createEmployeeInput.managerId,
      },
      include: {
        user: true,
        manager: {
          include: {
            user: true,
          },
        },
      },
    });

    return employee;
  }

  /**
   * Find all employees with pagination
   * @param pagination - Pagination input
   * @returns Paginated employees
   */
  async findAll(
    pagination: PaginationInput,
  ): Promise<IPaginatedType<Employee>> {
    const { skip, take } = pagination;

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        skip,
        take,
        include: {
          user: true,
          manager: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.employee.count(),
    ]);

    return {
      items,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  /**
   * Find an employee by ID
   * @param id - Employee ID
   * @returns Employee or null
   */
  async findOne(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: true,
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Find an employee by user ID
   * @param userId - User ID
   * @returns Employee or null
   */
  async findByUserId(userId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: true,
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Update an employee record
   * @param updateEmployeeInput - Employee data to update
   * @returns Updated employee
   */
  async update(updateEmployeeInput: UpdateEmployeeInput): Promise<Employee> {
    const employee = await this.findOne(updateEmployeeInput.id);

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${updateEmployeeInput.id} not found`,
      );
    }

    return this.prisma.employee.update({
      where: { id: updateEmployeeInput.id },
      data: {
        phoneNumber: updateEmployeeInput.phoneNumber,
        address: updateEmployeeInput.address,
        city: updateEmployeeInput.city,
        position: updateEmployeeInput.position,
        department: updateEmployeeInput.department,
        salary: updateEmployeeInput.salary,
        annualLeaveDays: updateEmployeeInput.annualLeaveDays,
        remainingLeave: updateEmployeeInput.remainingLeave,
        managerId: updateEmployeeInput.managerId,
      },
      include: {
        user: true,
        manager: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /**
   * Delete an employee record
   * @param id - Employee ID
   * @returns Deleted employee
   */
  async remove(id: string): Promise<Employee> {
    const employee = await this.findOne(id);

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return this.prisma.employee.delete({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get employees by department
   * @param department - Department name
   * @returns Array of employees in the department
   */
  async findByDepartment(department: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { department },
      include: {
        user: true,
        manager: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get subordinates of a manager
   * @param managerId - Manager employee ID
   * @returns Array of subordinates
   */
  async findSubordinates(managerId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { managerId },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Link an existing employee to an existing user account
   * @param employeeId - Employee ID
   * @param userId - User ID
   * @returns Updated employee with linked user
   */
  async linkToUser(employeeId: string, userId: string): Promise<Employee> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    if (employee.userId) {
      throw new ConflictException('Employee is already linked to a user');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const existingEmployeeForUser = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (existingEmployeeForUser) {
      throw new ConflictException('User is already linked to another employee');
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: { userId },
      include: {
        user: true,
        manager: {
          include: {
            user: true,
          },
        },
        subordinates: {
          include: {
            user: true,
          },
        },
      },
    });
  }
}
