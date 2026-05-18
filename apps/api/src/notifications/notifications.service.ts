import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  NotificationEntityType,
  NotificationType,
  Department,
  Notification as PrismaNotification,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { Notification } from './entities/notification.entity';
import { NotificationFilterInput } from './dto/notification-filter.input';

const DEDUP_WINDOW_HOURS = 24;

interface EmitRow {
  recipientId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  linkPath?: string | null;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // ─── Internal core ─────────────────────────────────────────────────────

  /**
   * Persist notifications, skipping any (recipientId, entityType, entityId)
   * triple that already has an unread row younger than DEDUP_WINDOW_HOURS.
   */
  private async emit(rows: EmitRow[]): Promise<void> {
    if (!rows.length) return;

    const cutoff = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000);

    const toInsert: EmitRow[] = [];
    for (const row of rows) {
      if (row.entityType && row.entityId) {
        const existing = await this.prisma.notification.findFirst({
          where: {
            recipientId: row.recipientId,
            entityType: row.entityType,
            entityId: row.entityId,
            isRead: false,
            createdAt: { gte: cutoff },
          },
          select: { id: true },
        });
        if (existing) continue;
      }
      toInsert.push(row);
    }

    if (!toInsert.length) return;

    await this.prisma.notification.createMany({ data: toInsert });
  }

  // ─── Recipient resolution helpers ──────────────────────────────────────

  private async usersInDepartments(
    departments: Department[],
  ): Promise<string[]> {
    const employees = await this.prisma.employee.findMany({
      where: { department: { in: departments }, userId: { not: null } },
      select: { userId: true },
    });
    return employees
      .map((e) => e.userId)
      .filter((id): id is string => id !== null);
  }

  async getApproversForLeaveRequest(employeeUserId: string): Promise<string[]> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId: employeeUserId },
      select: { managerId: true },
    });

    const managerUserIds: string[] = [];
    if (employee?.managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: employee.managerId },
        select: { userId: true },
      });
      if (manager?.userId) managerUserIds.push(manager.userId);
    }

    const departmentApproverIds = await this.usersInDepartments([
      Department.HR,
      Department.MANAGEMENT,
    ]);

    const all = new Set([...managerUserIds, ...departmentApproverIds]);
    all.delete(employeeUserId); // never notify the requester
    return [...all];
  }

  async getFleetWatchers(): Promise<string[]> {
    return this.usersInDepartments([Department.FLEET, Department.MANAGEMENT]);
  }

  async getStockWatchers(): Promise<string[]> {
    return this.usersInDepartments([
      Department.WAREHOUSE,
      Department.MANAGEMENT,
    ]);
  }

  async getHrWatchers(): Promise<string[]> {
    return this.usersInDepartments([Department.HR, Department.MANAGEMENT]);
  }

  // ─── Public emission helpers (called by other modules) ─────────────────

  async notifyLeaveSubmitted(input: {
    leaveRequestId: string;
    employeeName: string;
    employeeUserId: string;
  }): Promise<void> {
    const recipients = await this.getApproversForLeaveRequest(
      input.employeeUserId,
    );
    if (!recipients.length) return;

    await this.emit(
      recipients.map((recipientId) => ({
        recipientId,
        type: NotificationType.LEAVE_REQUEST_SUBMITTED,
        title: `${input.employeeName} submitted a leave request`,
        linkPath: `/hr/approvals?id=${input.leaveRequestId}`,
        entityType: NotificationEntityType.LEAVE_REQUEST,
        entityId: input.leaveRequestId,
      })),
    );
  }

  async notifyLeaveDecision(input: {
    leaveRequestId: string;
    requesterUserId: string;
    decision: 'APPROVED' | 'REJECTED';
    approverName: string;
  }): Promise<void> {
    const isApproved = input.decision === 'APPROVED';
    await this.emit([
      {
        recipientId: input.requesterUserId,
        type: isApproved
          ? NotificationType.LEAVE_REQUEST_APPROVED
          : NotificationType.LEAVE_REQUEST_REJECTED,
        title: `Your leave request was ${isApproved ? 'approved' : 'rejected'} by ${input.approverName}`,
        linkPath: `/hr/leave-requests?id=${input.leaveRequestId}`,
        entityType: NotificationEntityType.LEAVE_REQUEST,
        entityId: input.leaveRequestId,
      },
    ]);
  }

  async notifyTaskAssigned(input: {
    taskId: string;
    taskTitle: string;
    projectId: string;
    assigneeUserId: string;
    assignerUserId: string;
  }): Promise<void> {
    if (input.assigneeUserId === input.assignerUserId) return; // self-assignment

    await this.emit([
      {
        recipientId: input.assigneeUserId,
        type: NotificationType.PROJECT_TASK_ASSIGNED,
        title: `You were assigned: ${input.taskTitle}`,
        linkPath: `/projects/${input.projectId}?tab=tasks&taskId=${input.taskId}`,
        entityType: NotificationEntityType.PROJECT_TASK,
        entityId: input.taskId,
      },
    ]);
  }

  async notifyDocumentExpiring(input: {
    documentId: string;
    documentType: string;
    vehicleId: string;
    plateNumber: string;
    expiryDate: Date;
  }): Promise<void> {
    const recipients = await this.getFleetWatchers();
    if (!recipients.length) return;

    const dateStr = input.expiryDate.toISOString().slice(0, 10);
    await this.emit(
      recipients.map((recipientId) => ({
        recipientId,
        type: NotificationType.FLEET_DOCUMENT_EXPIRING,
        title: `${input.documentType} for ${input.plateNumber} expires on ${dateStr}`,
        linkPath: `/fleet/${input.vehicleId}?tab=documents`,
        entityType: NotificationEntityType.VEHICLE_DOCUMENT,
        entityId: input.documentId,
      })),
    );
  }

  async notifyEmployeeDocumentExpiring(input: {
    documentId: string;
    documentType: string;
    documentTitle: string;
    employeeName: string;
    expiryDate: Date;
  }): Promise<void> {
    const recipients = await this.getHrWatchers();
    if (!recipients.length) return;

    const dateStr = input.expiryDate.toISOString().slice(0, 10);
    await this.emit(
      recipients.map((recipientId) => ({
        recipientId,
        type: NotificationType.EMPLOYEE_DOCUMENT_EXPIRING,
        title: `${input.documentType} for ${input.employeeName} expires on ${dateStr}`,
        body: input.documentTitle,
        linkPath: `/documents?employeeDocumentId=${input.documentId}`,
        entityType: NotificationEntityType.EMPLOYEE_DOCUMENT,
        entityId: input.documentId,
      })),
    );
  }

  async notifyStockBelowMinimum(input: {
    productId: string;
    productName: string;
    sku: string;
    currentStock: number;
    minimumStock: number;
  }): Promise<void> {
    const recipients = await this.getStockWatchers();
    if (!recipients.length) return;

    await this.emit(
      recipients.map((recipientId) => ({
        recipientId,
        type: NotificationType.STOCK_BELOW_MINIMUM,
        title: `${input.productName} (${input.sku}) below minimum: ${input.currentStock}/${input.minimumStock}`,
        linkPath: `/stock/products`,
        entityType: NotificationEntityType.PRODUCT,
        entityId: input.productId,
      })),
    );
  }

  // ─── Read API (consumed by resolver) ───────────────────────────────────

  async myNotifications(
    userId: string,
    pagination: PaginationInput,
    filter?: NotificationFilterInput,
  ): Promise<IPaginatedType<Notification>> {
    const { skip, take } = pagination;
    const where = {
      recipientId: userId,
      ...(filter?.isRead !== undefined ? { isRead: filter.isRead } : {}),
      ...(filter?.type ? { type: filter.type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, meta: { total, skip, take } };
  }

  async myUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markRead(userId: string, id: string): Promise<PrismaNotification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    if (notification.recipientId !== userId) {
      throw new ForbiddenException(
        'Cannot modify notifications of another user',
      );
    }
    if (notification.isRead) return notification;

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }
}
