import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectMaterialStatus,
  ProjectMemberRole,
  ProjectStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { ProjectsFilterInput } from './dto/projects-filter.input';
import { ProjectFeedService } from './project-feed.service';

const projectInclude = {
  partner: true,
  createdBy: true,
  members: { where: { leftAt: null }, include: { user: true } },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: ProjectFeedService,
  ) {}

  async create(input: CreateProjectInput, createdById: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: input.partnerId },
    });
    if (!partner) {
      throw new NotFoundException(`Partner ${input.partnerId} not found`);
    }

    const codeTaken = await this.prisma.project.findUnique({
      where: { code: input.code },
    });
    if (codeTaken) {
      throw new ConflictException(`Project code ${input.code} already in use`);
    }

    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description,
          partnerId: input.partnerId,
          budget: input.budget ?? 0,
          currency: input.currency ?? 'RON',
          plannedStartDate: input.plannedStartDate,
          plannedEndDate: input.plannedEndDate,
          notes: input.notes,
          createdById,
        },
        include: projectInclude,
      });

      // Creator becomes the initial PROJECT_MANAGER
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: createdById,
          role: ProjectMemberRole.PROJECT_MANAGER,
        },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: project.id,
          type: 'PROJECT_CREATED',
          content: `Project "${project.name}" created`,
          authorId: createdById,
        },
        tx,
      );

      return tx.project.findUniqueOrThrow({
        where: { id: project.id },
        include: projectInclude,
      });
    });
  }

  async update(input: UpdateProjectInput, actorId: string) {
    const existing = await this.prisma.project.findUnique({
      where: { id: input.projectId },
    });
    if (!existing) {
      throw new NotFoundException(`Project ${input.projectId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.project.update({
        where: { id: input.projectId },
        data: {
          name: input.name ?? undefined,
          description: input.description ?? undefined,
          budget: input.budget ?? undefined,
          currency: input.currency ?? undefined,
          plannedStartDate: input.plannedStartDate ?? undefined,
          plannedEndDate: input.plannedEndDate ?? undefined,
          notes: input.notes ?? undefined,
        },
        include: projectInclude,
      });

      if (input.budget !== undefined && input.budget !== existing.budget) {
        await this.feed.recordAutoEntry(
          {
            projectId: updated.id,
            type: 'PROJECT_BUDGET_UPDATED',
            content: `Budget updated from ${existing.budget} to ${input.budget} ${updated.currency}`,
            authorId: actorId,
            metadata: { from: existing.budget, to: input.budget },
          },
          tx,
        );
      }

      return updated;
    });
  }

  async transitionStatus(
    projectId: string,
    next: ProjectStatus,
    actorId: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { materials: true, members: { where: { leftAt: null } } },
    });

    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const current = project.status;

    if (current === next) return project;

    this.assertValidTransition(current, next);

    if (next === ProjectStatus.ACTIVE && current === ProjectStatus.PLANNING) {
      const hasPM = project.members.some(
        (m) => m.role === ProjectMemberRole.PROJECT_MANAGER,
      );
      if (!hasPM) {
        throw new BadRequestException(
          'Cannot activate a project without a PROJECT_MANAGER',
        );
      }
    }

    if (next === ProjectStatus.COMPLETED) {
      const openAllocations = project.materials.filter(
        (m) =>
          m.status === ProjectMaterialStatus.REQUESTED ||
          m.status === ProjectMaterialStatus.RESERVED ||
          m.status === ProjectMaterialStatus.PARTIALLY_ISSUED,
      );
      if (openAllocations.length > 0) {
        throw new BadRequestException(
          `Cannot complete project: ${openAllocations.length} open material allocation(s) remain. Issue or cancel them first.`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updates: Prisma.ProjectUpdateInput = { status: next };

      if (next === ProjectStatus.ACTIVE && !project.actualStartDate) {
        updates.actualStartDate = now;
      }
      if (
        next === ProjectStatus.COMPLETED ||
        next === ProjectStatus.CANCELLED
      ) {
        updates.actualEndDate = now;
      }

      const updated = await tx.project.update({
        where: { id: projectId },
        data: updates,
        include: projectInclude,
      });

      if (next === ProjectStatus.CANCELLED) {
        // Release any open reservations
        const openReservations = project.materials.filter(
          (m) =>
            m.status === ProjectMaterialStatus.REQUESTED ||
            m.status === ProjectMaterialStatus.RESERVED,
        );
        for (const allocation of openReservations) {
          if (allocation.reservedQty > 0) {
            await tx.productStock.update({
              where: {
                productId_warehouseId: {
                  productId: allocation.productId,
                  warehouseId: allocation.warehouseId,
                },
              },
              data: { reservedQty: { decrement: allocation.reservedQty } },
            });
          }
          await tx.projectMaterial.update({
            where: { id: allocation.id },
            data: {
              status: ProjectMaterialStatus.CANCELLED,
              reservedQty: 0,
            },
          });
        }
      }

      await this.feed.recordAutoEntry(
        {
          projectId,
          type: 'PROJECT_STATUS_CHANGED',
          content: `Status changed: ${current} → ${next}`,
          authorId: actorId,
          metadata: { from: current, to: next },
        },
        tx,
      );

      return updated;
    });
  }

  private assertValidTransition(from: ProjectStatus, to: ProjectStatus) {
    const allowed: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.PLANNING]: [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED],
      [ProjectStatus.ACTIVE]: [
        ProjectStatus.ON_HOLD,
        ProjectStatus.COMPLETED,
        ProjectStatus.CANCELLED,
      ],
      [ProjectStatus.ON_HOLD]: [
        ProjectStatus.ACTIVE,
        ProjectStatus.COMPLETED,
        ProjectStatus.CANCELLED,
      ],
      [ProjectStatus.COMPLETED]: [],
      [ProjectStatus.CANCELLED]: [],
    };

    if (!allowed[from].includes(to)) {
      throw new BadRequestException(
        `Invalid status transition: ${from} → ${to}`,
      );
    }
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async findAll(
    filter: ProjectsFilterInput | undefined,
    currentUserId: string,
  ) {
    const where: Prisma.ProjectWhereInput = {
      status: filter?.status,
      partnerId: filter?.partnerId,
      ...(filter?.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { code: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filter?.onlyMine
        ? {
            members: {
              some: { userId: currentUserId, leftAt: null },
            },
          }
        : {}),
    };

    return this.prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCostRollup(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { budget: true, currency: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const [materialAgg, vehicleAgg] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where: { projectId, type: 'OUT' },
        select: { quantity: true, unitCost: true },
      }),
      this.prisma.vehicleExpense.aggregate({
        where: { projectId },
        _sum: { amount: true },
      }),
    ]);

    const materialsCost = materialAgg.reduce(
      (acc, m) => acc + m.quantity * (m.unitCost ?? 0),
      0,
    );
    const vehicleCost = vehicleAgg._sum.amount ?? 0;
    const totalActual = materialsCost + vehicleCost;

    return {
      budget: project.budget,
      currency: project.currency,
      materialsCost,
      vehicleCost,
      totalActual,
      remaining: project.budget - totalActual,
    };
  }
}
