import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectServiceStatus, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectServiceInput,
  DeleteProjectServiceInput,
  UpdateProjectServiceInput,
} from './dto/project-service.inputs';
import { ProjectFeedService } from './project-feed.service';

@Injectable()
export class ProjectServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: ProjectFeedService,
  ) {}

  private async assertProjectOpen(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    if (
      project.status === ProjectStatus.COMPLETED ||
      project.status === ProjectStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Project is ${project.status} - services are frozen`,
      );
    }
  }

  async list(projectId: string) {
    return this.prisma.projectService.findMany({
      where: { projectId, status: { not: ProjectServiceStatus.CANCELLED } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateProjectServiceInput, actorId: string) {
    if (input.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    if (input.unitPrice < 0) {
      throw new BadRequestException('Unit price cannot be negative');
    }
    if (input.vatRate < 0) {
      throw new BadRequestException('VAT rate cannot be negative');
    }
    await this.assertProjectOpen(input.projectId);

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.projectService.create({
        data: {
          projectId: input.projectId,
          description: input.description,
          quantity: input.quantity,
          unit: input.unit || 'service',
          unitPrice: input.unitPrice,
          vatRate: input.vatRate,
          status: input.status ?? ProjectServiceStatus.DELIVERED,
          billable: input.billable,
          notes: input.notes ?? null,
        },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'SERVICE_ADDED',
          content: `Service added: ${service.description}`,
          authorId: actorId,
          metadata: { serviceId: service.id },
        },
        tx,
      );

      return service;
    });
  }

  async update(input: UpdateProjectServiceInput, actorId: string) {
    await this.assertProjectOpen(input.projectId);
    const service = await this.prisma.projectService.findUnique({
      where: { id: input.serviceId },
    });
    if (!service || service.projectId !== input.projectId) {
      throw new NotFoundException('Project service not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectService.update({
        where: { id: service.id },
        data: {
          status: input.status ?? undefined,
          billable: input.billable ?? undefined,
        },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'SERVICE_UPDATED',
          content: `Service updated: ${updated.description}`,
          authorId: actorId,
          metadata: {
            serviceId: updated.id,
            status: updated.status,
            billable: updated.billable,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async remove(input: DeleteProjectServiceInput, actorId: string) {
    await this.assertProjectOpen(input.projectId);
    const service = await this.prisma.projectService.findUnique({
      where: { id: input.serviceId },
    });
    if (!service || service.projectId !== input.projectId) {
      throw new NotFoundException('Project service not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectService.update({
        where: { id: service.id },
        data: { status: ProjectServiceStatus.CANCELLED, billable: false },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'SERVICE_CANCELLED',
          content: `Service removed: ${updated.description}`,
          authorId: actorId,
          metadata: { serviceId: updated.id },
        },
        tx,
      );

      return updated;
    });
  }
}
