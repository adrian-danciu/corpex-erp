import { Injectable } from '@nestjs/common';
import { Prisma, ProjectFeedKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AutoEventType =
  | 'PROJECT_CREATED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_BUDGET_UPDATED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'MATERIAL_REQUESTED'
  | 'MATERIAL_RESERVED'
  | 'MATERIAL_ISSUED'
  | 'MATERIAL_CANCELLED'
  | 'SERVICE_ADDED'
  | 'SERVICE_UPDATED'
  | 'SERVICE_CANCELLED'
  | 'VEHICLE_ASSIGNED'
  | 'VEHICLE_UNASSIGNED'
  | 'TASK_CREATED'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_COMPLETED'
  | 'INVOICE_LINKED';

export interface AutoEventInput {
  projectId: string;
  type: AutoEventType;
  content: string;
  metadata?: Record<string, unknown>;
  authorId?: string | null;
}

@Injectable()
export class ProjectFeedService {
  constructor(private readonly prisma: PrismaService) {}

  async recordAutoEntry(input: AutoEventInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.projectFeedEntry.create({
      data: {
        projectId: input.projectId,
        kind: ProjectFeedKind.AUTO,
        authorId: input.authorId ?? null,
        content: input.content,
        metadata: {
          ...(input.metadata ?? {}),
          type: input.type,
        } as Prisma.InputJsonValue,
      },
    });
  }

  async listFeed(projectId: string, filter?: { kind?: ProjectFeedKind }) {
    return this.prisma.projectFeedEntry.findMany({
      where: {
        projectId,
        kind: filter?.kind,
        deletedAt: null,
      },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPost(input: {
    projectId: string;
    authorId: string;
    content: string;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
  }) {
    return this.prisma.projectFeedEntry.create({
      data: {
        projectId: input.projectId,
        kind: ProjectFeedKind.POST,
        authorId: input.authorId,
        content: input.content,
        attachmentUrl: input.attachmentUrl ?? null,
        attachmentName: input.attachmentName ?? null,
      },
      include: { author: true },
    });
  }

  async deletePost(entryId: string, actorId: string, isAdmin: boolean) {
    const entry = await this.prisma.projectFeedEntry.findUnique({
      where: { id: entryId },
    });
    if (!entry) {
      throw new Error('Feed entry not found');
    }
    if (entry.kind !== ProjectFeedKind.POST) {
      throw new Error('Cannot delete an automatic feed entry');
    }
    if (!isAdmin && entry.authorId !== actorId) {
      const fifteenMinutesMs = 15 * 60 * 1000;
      const isOwn = entry.authorId === actorId;
      const isFresh = Date.now() - entry.createdAt.getTime() < fifteenMinutesMs;
      if (!isOwn || !isFresh) {
        throw new Error('You can only delete your own posts within 15 minutes');
      }
    }

    return this.prisma.projectFeedEntry.update({
      where: { id: entryId },
      data: { deletedAt: new Date() },
    });
  }
}
