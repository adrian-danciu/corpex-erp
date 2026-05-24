import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Department, Role } from '@prisma/client';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockedCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

describe('UsersService employee account generation', () => {
  let prisma: {
    employee: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      employee: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new UsersService(prisma as never);
    mockedHash.mockResolvedValue('hashed-password' as never);
    mockedCompare.mockResolvedValue(true as never);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a user from employee data with generated email and temporary password', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'emp-1',
      firstName: 'Ana',
      lastName: 'Smith',
      userId: null,
      department: Department.MANAGEMENT,
      position: 'Manager',
    });
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      firstName: 'Ana',
      lastName: 'Smith',
      email: 'ana.smith@corpex.com',
      role: Role.USER,
      mustChangePassword: true,
    });
    prisma.employee.update.mockResolvedValue({});

    const result = await service.generateEmployeeAccount('emp-1');

    expect(mockedHash).toHaveBeenCalledWith('ana.smith.2026', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        firstName: 'Ana',
        lastName: 'Smith',
        email: 'ana.smith@corpex.com',
        password: 'hashed-password',
        role: Role.USER,
        mustChangePassword: true,
      },
    });
    expect(prisma.employee.update).toHaveBeenCalledWith({
      where: { id: 'emp-1' },
      data: { userId: 'user-1' },
    });
    expect(result).toEqual({
      employeeId: 'emp-1',
      employeeName: 'Ana Smith',
      email: 'ana.smith@corpex.com',
      initialPassword: 'ana.smith.2026',
      created: true,
      message: 'Account created',
    });
  });

  it('uses a numeric suffix when the generated email already exists', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'emp-2',
      firstName: 'Ana',
      lastName: 'Smith',
      userId: null,
    });
    prisma.user.findUnique
      .mockResolvedValueOnce({ id: 'existing-user' })
      .mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-2',
      email: 'ana.smith2@corpex.com',
    });
    prisma.employee.update.mockResolvedValue({});

    const result = await service.generateEmployeeAccount('emp-2');

    expect(mockedHash).toHaveBeenCalledWith('ana.smith2.2026', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        firstName: 'Ana',
        lastName: 'Smith',
        email: 'ana.smith2@corpex.com',
        password: 'hashed-password',
        role: Role.USER,
        mustChangePassword: true,
      },
    });
    expect(result.initialPassword).toBe('ana.smith2.2026');
  });

  it('reports skipped employees during bulk account generation', async () => {
    jest
      .spyOn(service, 'generateEmployeeAccount')
      .mockResolvedValueOnce({
        employeeId: 'emp-1',
        employeeName: 'Ana Smith',
        email: 'ana.smith@corpex.com',
        initialPassword: 'ana.smith.2026',
        created: true,
        message: 'Account created',
      })
      .mockRejectedValueOnce(
        new ConflictException('Employee already has an account'),
      )
      .mockRejectedValueOnce(new NotFoundException('Employee not found'));

    const result = await service.generateEmployeeAccounts([
      'emp-1',
      'emp-2',
      'emp-3',
    ]);

    expect(result).toEqual([
      expect.objectContaining({ employeeId: 'emp-1', created: true }),
      {
        employeeId: 'emp-2',
        employeeName: null,
        email: null,
        initialPassword: null,
        created: false,
        message: 'Employee already has an account',
      },
      {
        employeeId: 'emp-3',
        employeeName: null,
        email: null,
        initialPassword: null,
        created: false,
        message: 'Employee not found',
      },
    ]);
  });

  it('clears the mandatory password change flag after changing password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      password: 'old-hash',
    });
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      mustChangePassword: false,
    });

    await service.changePassword('user-1', 'old-password', 'new-password');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        password: 'hashed-password',
        mustChangePassword: false,
      },
    });
  });
});
