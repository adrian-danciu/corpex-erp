import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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

const taskInclude = { assignee: true, createdBy: true };

@Injectable()
export class ProjectTasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: ProjectFeedService,
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

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.projectTask.create({
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
          content: `Task created: "${task.title}"`,
          authorId: actorId,
          metadata: { taskId: task.id, assigneeId: task.assigneeId },
        },
        tx,
      );

      return task;
    });
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

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectTask.update({
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

      if (
        input.assigneeId !== undefined &&
        input.assigneeId !== task.assigneeId
      ) {
        await this.feed.recordAutoEntry(
          {
            projectId: task.projectId,
            type: 'TASK_ASSIGNED',
            content: input.assigneeId
              ? `Task "${updated.title}" assigned to ${updated.assignee?.firstName ?? ''} ${updated.assignee?.lastName ?? ''}`.trim()
              : `Task "${updated.title}" unassigned`,
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

      return updated;
    });
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
    const isPM =
      membership?.role === ProjectMemberRole.PROJECT_MANAGER;

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
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
    });
  }
}
