import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignProjectVehicleInput,
  EndProjectVehicleAssignmentInput,
} from './dto/project-vehicle.inputs';
import { ProjectFeedService } from './project-feed.service';

@Injectable()
export class ProjectVehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly feed: ProjectFeedService,
  ) {}

  async assign(input: AssignProjectVehicleInput, actorId: string) {
    const [project, vehicle] = await Promise.all([
      this.prisma.project.findUnique({ where: { id: input.projectId } }),
      this.prisma.vehicle.findUnique({ where: { id: input.vehicleId } }),
    ]);
    if (!project) throw new NotFoundException('Project not found');
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (
      project.status === ProjectStatus.COMPLETED ||
      project.status === ProjectStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Project is ${project.status} — cannot assign vehicles`,
      );
    }

    const startDate = input.startDate ?? new Date();
    if (input.endDate && input.endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    return this.prisma.$transaction(async (tx) => {
      // Auto-end any open assignment for this vehicle
      const openAssignment = await tx.projectVehicle.findFirst({
        where: { vehicleId: input.vehicleId, endDate: null },
      });
      if (openAssignment) {
        await tx.projectVehicle.update({
          where: { id: openAssignment.id },
          data: { endDate: startDate },
        });
        await this.feed.recordAutoEntry(
          {
            projectId: openAssignment.projectId,
            type: 'VEHICLE_UNASSIGNED',
            content: `Vehicle ${vehicle.plateNumber} unassigned (reassigned to another project)`,
            authorId: actorId,
            metadata: {
              assignmentId: openAssignment.id,
              vehicleId: vehicle.id,
              auto: true,
            },
          },
          tx,
        );
      }

      // Detect overlap with closed assignments
      const overlap = await tx.projectVehicle.findFirst({
        where: {
          vehicleId: input.vehicleId,
          startDate: { lt: input.endDate ?? new Date('2999-12-31') },
          endDate: { gt: startDate },
        },
      });
      if (overlap) {
        throw new BadRequestException(
          `Vehicle ${vehicle.plateNumber} is already assigned in the requested time window`,
        );
      }

      const assignment = await tx.projectVehicle.create({
        data: {
          projectId: input.projectId,
          vehicleId: input.vehicleId,
          startDate,
          endDate: input.endDate,
          notes: input.notes,
        },
        include: { vehicle: true },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'VEHICLE_ASSIGNED',
          content: `Vehicle ${vehicle.plateNumber} (${vehicle.brand} ${vehicle.model}) assigned`,
          authorId: actorId,
          metadata: {
            assignmentId: assignment.id,
            vehicleId: vehicle.id,
          },
        },
        tx,
      );

      return assignment;
    });
  }

  async endAssignment(
    input: EndProjectVehicleAssignmentInput,
    actorId: string,
  ) {
    const assignment = await this.prisma.projectVehicle.findUnique({
      where: { id: input.assignmentId },
      include: { vehicle: true },
    });
    if (!assignment || assignment.projectId !== input.projectId) {
      throw new NotFoundException('Assignment not found');
    }
    if (assignment.endDate) {
      throw new BadRequestException('Assignment is already ended');
    }

    const endDate = input.endDate ?? new Date();
    if (endDate <= assignment.startDate) {
      throw new BadRequestException('endDate must be after the assignment startDate');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectVehicle.update({
        where: { id: assignment.id },
        data: { endDate },
        include: { vehicle: true },
      });

      await this.feed.recordAutoEntry(
        {
          projectId: assignment.projectId,
          type: 'VEHICLE_UNASSIGNED',
          content: `Vehicle ${assignment.vehicle.plateNumber} unassigned`,
          authorId: actorId,
          metadata: {
            assignmentId: assignment.id,
            vehicleId: assignment.vehicleId,
          },
        },
        tx,
      );

      return updated;
    });
  }

  async listForProject(projectId: string) {
    return this.prisma.projectVehicle.findMany({
      where: { projectId },
      include: { vehicle: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async currentProjectForVehicle(vehicleId: string) {
    const open = await this.prisma.projectVehicle.findFirst({
      where: { vehicleId, endDate: null },
      include: { project: true },
    });
    return open?.project ?? null;
  }
}
