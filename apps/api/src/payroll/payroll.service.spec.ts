import { BadRequestException, ConflictException } from '@nestjs/common';
import { PayrollStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollService } from './payroll.service';

describe('PayrollService', () => {
  let prisma: {
    payrollPeriod: {
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      create: jest.Mock;
    };
    employee: { findMany: jest.Mock };
    leaveRequest: { findMany: jest.Mock };
    companySettings: { upsert: jest.Mock };
  };
  let service: PayrollService;

  beforeEach(() => {
    prisma = {
      payrollPeriod: {
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
      },
      employee: { findMany: jest.fn() },
      leaveRequest: { findMany: jest.fn() },
      companySettings: { upsert: jest.fn() },
    };
    service = new PayrollService(prisma as unknown as PrismaService);
  });

  it('rejects duplicate payroll periods', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({ id: 'period-1' });

    await expect(
      service.generate({ year: 2026, month: 5 }, 'user-1'),
    ).rejects.toThrow(ConflictException);

    expect(prisma.payrollPeriod.create).not.toHaveBeenCalled();
  });

  it('only draft periods can be approved', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({
      status: PayrollStatus.APPROVED,
    });

    await expect(service.approve('period-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.payrollPeriod.update).not.toHaveBeenCalled();
  });

  it('only approved periods can be marked paid', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({
      status: PayrollStatus.DRAFT,
    });

    await expect(service.markPaid('period-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.payrollPeriod.update).not.toHaveBeenCalled();
  });

  it('draft deletion rejects non-draft periods', async () => {
    prisma.payrollPeriod.findUnique.mockResolvedValue({
      id: 'period-1',
      status: PayrollStatus.APPROVED,
      lines: [],
    });

    await expect(service.remove('period-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.payrollPeriod.delete).not.toHaveBeenCalled();
  });
});
