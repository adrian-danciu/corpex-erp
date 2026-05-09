import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Department, ProjectMemberRole, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PROJECT_ACCESS_KEY,
  ProjectAccessLevel,
} from '../decorators/project-access.decorator';

interface RequestUser {
  id: string;
  role: Role;
  department: Department | null;
}

@Injectable()
export class ProjectAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<ProjectAccessLevel>(
      PROJECT_ACCESS_KEY,
      context.getHandler(),
    );

    if (!required) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext<{ req: { user: RequestUser } }>().req.user;

    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.role === Role.ADMIN) return true;
    if (user.department === Department.MANAGEMENT) return true;

    const projectId = await this.resolveProjectId(ctx.getArgs());
    if (!projectId) {
      throw new ForbiddenException('Could not determine project context');
    }

    const membership = await this.prisma.projectMember.findFirst({
      where: { projectId, userId: user.id, leftAt: null },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    if (
      required === 'manager' &&
      membership.role !== ProjectMemberRole.PROJECT_MANAGER
    ) {
      throw new ForbiddenException(
        'This action requires the PROJECT_MANAGER role on the project',
      );
    }

    return true;
  }

  private async resolveProjectId(args: Record<string, unknown>): Promise<string | null> {
    const direct = this.findStringField(args, 'projectId');
    if (direct) return direct;

    const taskId = this.findStringField(args, 'taskId');
    if (taskId) {
      const row = await this.prisma.projectTask.findUnique({
        where: { id: taskId },
        select: { projectId: true },
      });
      if (!row) throw new NotFoundException(`Task ${taskId} not found`);
      return row.projectId;
    }

    const materialId = this.findStringField(args, 'projectMaterialId');
    if (materialId) {
      const row = await this.prisma.projectMaterial.findUnique({
        where: { id: materialId },
        select: { projectId: true },
      });
      if (!row) throw new NotFoundException(`Material allocation ${materialId} not found`);
      return row.projectId;
    }

    const assignmentId = this.findStringField(args, 'assignmentId');
    if (assignmentId) {
      const row = await this.prisma.projectVehicle.findUnique({
        where: { id: assignmentId },
        select: { projectId: true },
      });
      if (!row) throw new NotFoundException(`Vehicle assignment ${assignmentId} not found`);
      return row.projectId;
    }

    const feedEntryId = this.findStringField(args, 'feedEntryId');
    if (feedEntryId) {
      const row = await this.prisma.projectFeedEntry.findUnique({
        where: { id: feedEntryId },
        select: { projectId: true },
      });
      if (!row) throw new NotFoundException(`Feed entry ${feedEntryId} not found`);
      return row.projectId;
    }

    const memberId = this.findStringField(args, 'memberId');
    if (memberId) {
      const row = await this.prisma.projectMember.findUnique({
        where: { id: memberId },
        select: { projectId: true },
      });
      if (!row) throw new NotFoundException(`Project member ${memberId} not found`);
      return row.projectId;
    }

    return null;
  }

  private findStringField(args: Record<string, unknown>, key: string): string | null {
    if (typeof args[key] === 'string') return args[key] as string;
    for (const value of Object.values(args)) {
      if (value && typeof value === 'object') {
        const nested = (value as Record<string, unknown>)[key];
        if (typeof nested === 'string') return nested;
      }
    }
    return null;
  }
}
