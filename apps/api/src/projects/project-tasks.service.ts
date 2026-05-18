import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Department,
  ProjectMemberRole,
  ProjectTaskStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectTaskInput,
  TransitionProjectTaskInput,
  UpdateProjectTaskInput,
} from './dto/project-task.inputs';
import { ProjectFeedService } from './project-feed.service';
import { NotificationsService } from '../notifications/notifications.service';

const taskInclude = { assignee: true, createdBy: true };

@Injectable()
export class ProjectTasksService {
  private readonly logger = new Logger(ProjectTasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: ProjectFeedService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(input: CreateProjectTaskInput, actorId: string) {
    if (input.assigneeId) {
      const isMember = await this.prisma.projectMember.findFirst({
        where: {
          projectId: input.projectId,
          userId: input.assigneeId,
          leftAt: null,
        },
      });
      if (!isMember) {
        throw new BadRequestException(
          'Assignee must be an active member of the project',
        );
      }
    }

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.projectTask.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          assigneeId: input.assigneeId,
          priority: input.priority,
          dueDate: input.dueDate,
          createdById: actorId,
        },
        include: taskInclude,
      });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'TASK_CREATED',
          content: `Task created: "${created.title}"`,
          authorId: actorId,
          metadata: { taskId: created.id, assigneeId: created.assigneeId },
        },
        tx,
      );

      return created;
    });

    if (task.assigneeId) {
      this.notifications
        .notifyTaskAssigned({
          taskId: task.id,
          taskTitle: task.title,
          projectId: task.projectId,
          assigneeUserId: task.assigneeId,
          assignerUserId: actorId,
        })
        .catch((err) =>
          this.logger.error('Failed to emit notifyTaskAssigned (create)', err),
        );
    }

    return task;
  }

  async update(input: UpdateProjectTaskInput, actorId: string) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id: input.taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    if (input.assigneeId !== undefined && input.assigneeId !== null) {
      const isMember = await this.prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: input.assigneeId,
          leftAt: null,
        },
      });
      if (!isMember) {
        throw new BadRequestException(
          'Assignee must be an active member of the project',
        );
      }
    }

    const assigneeChanged =
      input.assigneeId !== undefined && input.assigneeId !== task.assigneeId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.projectTask.update({
        where: { id: task.id },
        data: {
          title: input.title ?? undefined,
          description: input.description ?? undefined,
          assigneeId:
            input.assigneeId === undefined ? undefined : input.assigneeId,
          priority: input.priority ?? undefined,
          dueDate: input.dueDate === undefined ? undefined : input.dueDate,
        },
        include: taskInclude,
      });

      if (assigneeChanged) {
        await this.feed.recordAutoEntry(
          {
            projectId: task.projectId,
            type: 'TASK_ASSIGNED',
            content: input.assigneeId
              ? `Task "${result.title}" assigned to ${result.assignee?.firstName ?? ''} ${result.assignee?.lastName ?? ''}`.trim()
              : `Task "${result.title}" unassigned`,
            authorId: actorId,
            metadata: {
              taskId: task.id,
              from: task.assigneeId,
              to: input.assigneeId,
            },
          },
          tx,
        );
      }

      return result;
    });

    if (assigneeChanged && updated.assigneeId) {
      this.notifications
        .notifyTaskAssigned({
          taskId: updated.id,
          taskTitle: updated.title,
          projectId: updated.projectId,
          assigneeUserId: updated.assigneeId,
          assignerUserId: actorId,
        })
        .catch((err) =>
          this.logger.error('Failed to emit notifyTaskAssigned (update)', err),
        );
    }

    return updated;
  }

  async transition(
    input: TransitionProjectTaskInput,
    actor: {
      id: string;
      role: Role;
      department: Department | null;
    },
  ) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id: input.taskId },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status === input.status) return task;

    const isAdmin = actor.role === Role.ADMIN;
    const isManagement = actor.department === Department.MANAGEMENT;
    const isAssignee = task.assigneeId === actor.id;
    const membership = await this.prisma.projectMember.findFirst({
      where: { projectId: task.projectId, userId: actor.id, leftAt: null },
    });
    const isPM = membership?.role === ProjectMemberRole.PROJECT_MANAGER;

    if (!isAdmin && !isManagement && !isPM && !isAssignee) {
      throw new ForbiddenException(
        'Only the assignee or a PROJECT_MANAGER can transition this task',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const completed = input.status === ProjectTaskStatus.DONE;
      const updated = await tx.projectTask.update({
        where: { id: task.id },
        data: {
          status: input.status,
          completedAt: completed ? new Date() : null,
        },
        include: taskInclude,
      });

      await this.feed.recordAutoEntry(
        {
          projectId: task.projectId,
          type: completed ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
          content: `Task "${task.title}": ${task.status} → ${input.status}`,
          authorId: actor.id,
          metadata: {
            taskId: task.id,
            from: task.status,
            to: input.status,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async list(projectId: string) {
    return this.prisma.projectTask.findMany({
      where: { projectId },
      include: taskInclude,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async myTasks(userId: string) {
    return this.prisma.projectTask.findMany({
      where: {
        assigneeId: userId,
        status: { notIn: [ProjectTaskStatus.DONE] },
      },
      include: taskInclude,
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async delete(taskId: string, actorId: string) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.$transaction(async (tx) => {
      await this.feed.recordAutoEntry(
        {
          projectId: task.projectId,
          type: 'TASK_STATUS_CHANGED',
          content: `Task "${task.title}" was deleted`,
          authorId: actorId,
          metadata: { taskId: task.id, deleted: true },
        },
        tx,
      );

      const deleted = await tx.projectTask.delete({
        where: { id: task.id },
      });
      return deleted;
    });
  }

  async activity(taskId: string) {
    const task = await this.prisma.projectTask.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const entries = await this.prisma.projectFeedEntry.findMany({
      where: {
        projectId: task.projectId,
        deletedAt: null,
      },
      include: { author: true },
      orderBy: { createdAt: 'asc' },
    });

    return entries.filter((e) => {
      const meta = (e.metadata as Record<string, unknown> | null) ?? null;
      return meta && meta.taskId === taskId;
    });
  }
}
