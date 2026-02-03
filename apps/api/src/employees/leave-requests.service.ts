import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveRequestInput } from './dto/create-leave-request.input';
import { ApproveLeaveRequestInput } from './dto/approve-leave-request.input';
import { LeaveRequest } from './entities/leave-request.entity';
import { LeaveStatus } from '@prisma/client';

@Injectable()
export class LeaveRequestsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new leave request
   * @param userId - User ID making the request
   * @param createLeaveRequestInput - Leave request data
   * @returns Created leave request
   */
  async create(
    userId: string,
    createLeaveRequestInput: CreateLeaveRequestInput,
  ): Promise<LeaveRequest> {
    // Get employee record to check remaining leave
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      throw new NotFoundException('Employee record not found');
    }

    // Check if employee has enough leave days (only for annual leave)
    if (createLeaveRequestInput.leaveType === 'ANNUAL') {
      if (employee.remainingLeave < createLeaveRequestInput.days) {
        throw new BadRequestException(
          `Insufficient leave days. Remaining: ${employee.remainingLeave}, Requested: ${createLeaveRequestInput.days}`,
        );
      }
    }

    // Create the leave request
    const leaveRequest = await this.prisma.leaveRequest.create({
      data: {
        employeeId: userId,
        leaveType: createLeaveRequestInput.leaveType,
        startDate: createLeaveRequestInput.startDate,
        endDate: createLeaveRequestInput.endDate,
        days: createLeaveRequestInput.days,
        reason: createLeaveRequestInput.reason,
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    return leaveRequest;
  }

  /**
   * Find all leave requests
   * @returns Array of all leave requests
   */
  async findAll(): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      include: {
        employee: true,
        approver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find leave requests by employee
   * @param employeeId - Employee user ID
   * @returns Array of leave requests
   */
  async findByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: {
        employee: true,
        approver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find pending leave requests for a manager's subordinates
   * @param managerId - Manager user ID
   * @returns Array of pending leave requests
   */
  async findPendingForManager(managerId: string): Promise<LeaveRequest[]> {
    // Get manager's employee record
    const managerEmployee = await this.prisma.employee.findUnique({
      where: { userId: managerId },
      include: {
        subordinates: true,
      },
    });

    if (!managerEmployee) {
      throw new NotFoundException('Manager employee record not found');
    }

    // Get all subordinate user IDs
    const subordinateUserIds = managerEmployee.subordinates.map(
      (sub) => sub.userId,
    );

    // Find pending leave requests from subordinates
    return this.prisma.leaveRequest.findMany({
      where: {
        employeeId: {
          in: subordinateUserIds,
        },
        status: LeaveStatus.PENDING,
      },
      include: {
        employee: true,
        approver: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Approve or reject a leave request
   * @param approverId - User ID of the approver
   * @param approveLeaveRequestInput - Approval data
   * @returns Updated leave request
   */
  async approveOrReject(
    approverId: string,
    approveLeaveRequestInput: ApproveLeaveRequestInput,
  ): Promise<LeaveRequest> {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id: approveLeaveRequestInput.leaveRequestId },
      include: {
        employee: true,
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Leave request has already been processed');
    }

    // Check if approver is the manager of the employee
    const employee = await this.prisma.employee.findUnique({
      where: { userId: leaveRequest.employeeId },
    });

    if (!employee) {
      throw new NotFoundException('Employee record not found');
    }

    const approverEmployee = await this.prisma.employee.findUnique({
      where: { userId: approverId },
    });

    if (!approverEmployee) {
      throw new NotFoundException('Approver employee record not found');
    }

    // Check if the approver is the employee's manager
    if (employee.managerId !== approverEmployee.id) {
      throw new ForbiddenException(
        'You are not authorized to approve this leave request',
      );
    }

    const newStatus = approveLeaveRequestInput.approved
      ? LeaveStatus.APPROVED
      : LeaveStatus.REJECTED;

    // Update the leave request
    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: { id: approveLeaveRequestInput.leaveRequestId },
      data: {
        status: newStatus,
        approverId,
        comments: approveLeaveRequestInput.comments,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    // If approved and it's annual leave, deduct from remaining leave
    if (
      approveLeaveRequestInput.approved &&
      leaveRequest.leaveType === 'ANNUAL'
    ) {
      await this.prisma.employee.update({
        where: { userId: leaveRequest.employeeId },
        data: {
          remainingLeave: {
            decrement: leaveRequest.days,
          },
        },
      });
    }

    return updatedLeaveRequest;
  }

  /**
   * Cancel a leave request (by the employee)
   * @param userId - User ID making the cancellation
   * @param leaveRequestId - Leave request ID to cancel
   * @returns Updated leave request
   */
  async cancel(userId: string, leaveRequestId: string): Promise<LeaveRequest> {
    const leaveRequest = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.employeeId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to cancel this leave request',
      );
    }

    if (
      leaveRequest.status !== LeaveStatus.PENDING &&
      leaveRequest.status !== LeaveStatus.APPROVED
    ) {
      throw new BadRequestException('Leave request cannot be cancelled');
    }

    // If the request was approved and is annual leave, restore the days
    if (
      leaveRequest.status === LeaveStatus.APPROVED &&
      leaveRequest.leaveType === 'ANNUAL'
    ) {
      await this.prisma.employee.update({
        where: { userId },
        data: {
          remainingLeave: {
            increment: leaveRequest.days,
          },
        },
      });
    }

    return this.prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: LeaveStatus.CANCELLED,
      },
      include: {
        employee: true,
        approver: true,
      },
    });
  }

  /**
   * Get a single leave request by ID
   * @param id - Leave request ID
   * @returns Leave request or null
   */
  async findOne(id: string): Promise<LeaveRequest | null> {
    return this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        approver: true,
      },
    });
  }
}
