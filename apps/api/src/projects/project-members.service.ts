import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddProjectMemberInput,
  RemoveProjectMemberInput,
  UpdateProjectMemberRoleInput,
} from './dto/add-project-member.input';
import { ProjectFeedService } from './project-feed.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: ProjectFeedService,
  ) {}

  async addMember(input: AddProjectMemberInput, actorId: string) {
    const [project, user] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: input.projectId } }),
      this.prisma.user.findUnique({ where: { id: input.userId } }),
    ]);
    if (!project)
      throw new NotFoundException(`Project ${input.projectId} not found`);
    if (!user) throw new NotFoundException(`User ${input.userId} not found`);

    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: input.projectId,
          userId: input.userId,
        },
      },
    });
    if (existing && !existing.leftAt) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prisma.$transaction(async (tx) => {
      const member = existing
        ? await tx.projectMember.update({
            where: { id: existing.id },
            data: {
              role: input.role,
              joinedAt: new Date(),
              leftAt: null,
            },
            include: { user: true },
          })
        : await tx.projectMember.create({
            data: {
              projectId: input.projectId,
              userId: input.userId,
              role: input.role,
            },
            include: { user: true },
          });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'MEMBER_ADDED',
          content: `${user.firstName} ${user.lastName} added as ${input.role}`,
          authorId: actorId,
          metadata: { memberId: member.id, role: input.role },
        },
        tx,
      );

      return member;
    });
  }

  async updateRole(input: UpdateProjectMemberRoleInput, actorId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: input.memberId },
      include: { user: true },
    });
    if (!member)
      throw new NotFoundException(`Member ${input.memberId} not found`);
    if (member.projectId !== input.projectId) {
      throw new BadRequestException('Member does not belong to this project');
    }
    if (member.leftAt) {
      throw new BadRequestException('Cannot change role of an inactive member');
    }
    if (member.role === input.role) return member;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
        include: { user: true },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'MEMBER_ROLE_CHANGED',
          content: `${member.user.firstName} ${member.user.lastName}: ${member.role} → ${input.role}`,
          authorId: actorId,
          metadata: { memberId: member.id, from: member.role, to: input.role },
        },
        tx,
      );

      return updated;
    });
  }

  async removeMember(input: RemoveProjectMemberInput, actorId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { id: input.memberId },
      include: { user: true },
    });
    if (!member)
      throw new NotFoundException(`Member ${input.memberId} not found`);
    if (member.projectId !== input.projectId) {
      throw new BadRequestException('Member does not belong to this project');
    }
    if (member.leftAt) return member;

    if (member.role === ProjectMemberRole.PROJECT_MANAGER) {
      const otherPmCount = await this.prisma.projectMember.count({
        where: {
          projectId: input.projectId,
          role: ProjectMemberRole.PROJECT_MANAGER,
          leftAt: null,
          id: { not: member.id },
        },
      });
      if (otherPmCount === 0) {
        throw new BadRequestException(
          'Cannot remove the last PROJECT_MANAGER. Promote another member first.',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: { id: input.memberId },
        data: { leftAt: new Date() },
        include: { user: true },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'MEMBER_REMOVED',
          content: `${member.user.firstName} ${member.user.lastName} removed from project`,
          authorId: actorId,
          metadata: { memberId: member.id },
        },
        tx,
      );

      return updated;
    });
  }

  async listActive(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { projectId, leftAt: null },
      include: { user: true },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }
}
