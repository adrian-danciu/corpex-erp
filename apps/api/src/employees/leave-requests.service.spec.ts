import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LeaveStatus, LeaveType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeaveRequestsService } from './leave-requests.service';

describe('LeaveRequestsService', () => {
  let prisma: {
    leaveRequest: { findUnique: jest.Mock; update: jest.Mock };
    employee: { findUnique: jest.Mock; update: jest.Mock };
  };
  let service: LeaveRequestsService;

  beforeEach(() => {
    prisma = {
      leaveRequest: { findUnique: jest.fn(), update: jest.fn() },
      employee: { findUnique: jest.fn(), update: jest.fn() },
    };
    service = new LeaveRequestsService(
      prisma as unknown as PrismaService,
      {
        notifyLeaveSubmitted: jest.fn(),
        notifyLeaveDecision: jest.fn(),
      } as unknown as NotificationsService,
    );
  });

  it('employee cannot approve own request', async () => {
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'leave-1',
      employeeId: 'user-1',
      status: LeaveStatus.PENDING,
      leaveType: LeaveType.ANNUAL,
      days: 2,
      employee: { id: 'employee-1' },
    });

    await expect(
      service.approveOrReject('user-1', {
        leaveRequestId: 'leave-1',
        approved: true,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
  });

  it('non-manager approval is rejected', async () => {
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'leave-1',
      employeeId: 'employee-user-1',
      status: LeaveStatus.PENDING,
      leaveType: LeaveType.ANNUAL,
      days: 2,
      employee: { id: 'employee-1' },
    });
    prisma.employee.findUnique
      .mockResolvedValueOnce({
        id: 'employee-1',
        managerId: 'manager-employee-1',
      })
      .mockResolvedValueOnce({ id: 'other-employee-1' });

    await expect(
      service.approveOrReject('other-user-1', {
        leaveRequestId: 'leave-1',
        approved: true,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
  });

  it('cancelling is only allowed for own pending requests', async () => {
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'leave-1',
      employeeId: 'user-1',
      status: LeaveStatus.APPROVED,
      leaveType: LeaveType.ANNUAL,
      days: 2,
    });

    await expect(service.cancel('user-1', 'leave-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    expect(prisma.employee.update).not.toHaveBeenCalled();
  });
});
