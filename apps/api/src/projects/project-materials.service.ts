import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ProjectMaterialStatus,
  ProjectStatus,
  StockMovementType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import {
  AllocateProjectMaterialInput,
  RemoveProjectMaterialInput,
} from './dto/project-material.inputs';
import { ProjectFeedService } from './project-feed.service';

const allocationInclude = {
  product: true,
  warehouse: true,
};

@Injectable()
export class ProjectMaterialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stock: StockService,
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
        `Project is ${project.status} — material allocations are frozen`,
      );
    }
  }

  /**
   * One-shot allocation: decrements stock, creates an OUT stock movement,
   * and records a fully-issued ProjectMaterial. Replaces the older
   * request → reserve → issue flow.
   */
  async allocate(input: AllocateProjectMaterialInput, actorId: string) {
    if (input.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }
    await this.assertProjectOpen(input.projectId);

    const [product, warehouse, productStock] = await Promise.all([
      this.prisma.product.findUnique({ where: { id: input.productId } }),
      this.prisma.warehouse.findUnique({ where: { id: input.warehouseId } }),
      this.prisma.productStock.findUnique({
        where: {
          productId_warehouseId: {
            productId: input.productId,
            warehouseId: input.warehouseId,
          },
        },
      }),
    ]);
    if (!product) throw new NotFoundException('Product not found');
    if (!warehouse) throw new NotFoundException('Warehouse not found');

    const onHand = productStock?.quantity ?? 0;
    if (onHand < input.quantity) {
      throw new BadRequestException(
        `Insufficient stock: ${onHand} ${product.unit} available in ${warehouse.code}, ${input.quantity} requested`,
      );
    }

    const unitCost = input.unitCost ?? product.unitPrice ?? 0;

    return this.prisma.$transaction(async (tx) => {
      const allocation = await tx.projectMaterial.create({
        data: {
          projectId: input.projectId,
          productId: input.productId,
          warehouseId: input.warehouseId,
          requestedQty: input.quantity,
          issuedQty: input.quantity,
          unitCost,
          status: ProjectMaterialStatus.FULLY_ISSUED,
          notes: input.notes,
        },
        include: allocationInclude,
      });

      await this.stock.issueStock(
        {
          productId: input.productId,
          warehouseId: input.warehouseId,
          qty: input.quantity,
          unitCost,
          notes: input.notes ?? null,
          projectId: input.projectId,
          projectMaterialId: allocation.id,
          performedById: actorId,
        },
        tx,
      );

      await this.feed.recordAutoEntry(
        {
          projectId: input.projectId,
          type: 'MATERIAL_ISSUED',
          content: `Allocated ${input.quantity} ${product.unit} of ${product.name} from ${warehouse.code}`,
          authorId: actorId,
          metadata: {
            allocationId: allocation.id,
            qty: input.quantity,
            unitCost,
          },
        },
        tx,
      );

      return allocation;
    });
  }

  /**
   * Removes an allocation: returns the materials to the warehouse,
   * creates a balancing IN stock movement, and soft-deletes the allocation
   * (marked CANCELLED so the audit trail stays intact). The frontend
   * filters CANCELLED rows out of the list view.
   */
  async remove(input: RemoveProjectMaterialInput, actorId: string) {
    const allocation = await this.prisma.projectMaterial.findUnique({
      where: { id: input.projectMaterialId },
      include: { product: true, warehouse: true },
    });
    if (!allocation || allocation.projectId !== input.projectId) {
      throw new NotFoundException('Allocation not found');
    }
    if (allocation.status === ProjectMaterialStatus.CANCELLED) {
      throw new BadRequestException('Already removed');
    }

    return this.prisma.$transaction(async (tx) => {
      const returnQty = allocation.issuedQty;

      if (returnQty > 0) {
        await tx.productStock.upsert({
          where: {
            productId_warehouseId: {
              productId: allocation.productId,
              warehouseId: allocation.warehouseId,
            },
          },
          update: { quantity: { increment: returnQty } },
          create: {
            productId: allocation.productId,
            warehouseId: allocation.warehouseId,
            quantity: returnQty,
          },
        });

        const aggregate = await tx.productStock.aggregate({
          where: { productId: allocation.productId },
          _sum: { quantity: true },
        });
        await tx.product.update({
          where: { id: allocation.productId },
          data: { currentStock: aggregate._sum.quantity ?? 0 },
        });

        await tx.stockMovement.create({
          data: {
            productId: allocation.productId,
            warehouseId: allocation.warehouseId,
            type: StockMovementType.IN,
            quantity: returnQty,
            unitCost: allocation.unitCost > 0 ? allocation.unitCost : null,
            notes: `Returned from project allocation ${allocation.id}`,
            createdById: actorId,
            projectId: allocation.projectId,
            projectMaterialId: allocation.id,
          },
        });
      }

      // Release any leftover reservation (for legacy reserved-but-not-issued data)
      if (allocation.reservedQty > 0) {
        await this.stock.releaseReservation(
          allocation.productId,
          allocation.warehouseId,
          allocation.reservedQty,
          tx,
        );
      }

      const updated = await tx.projectMaterial.update({
        where: { id: allocation.id },
        data: {
          status: ProjectMaterialStatus.CANCELLED,
          reservedQty: 0,
          // Keep issuedQty / unitCost for audit trail
        },
        include: allocationInclude,
      });

      await this.feed.recordAutoEntry(
        {
          projectId: allocation.projectId,
          type: 'MATERIAL_CANCELLED',
          content: `Removed allocation of ${returnQty} ${allocation.product.unit} of ${allocation.product.name} (returned to ${allocation.warehouse.code})`,
          authorId: actorId,
          metadata: { allocationId: allocation.id, returnedQty: returnQty },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Lists active allocations only (CANCELLED rows are hidden).
   */
  async list(projectId: string) {
    return this.prisma.projectMaterial.findMany({
      where: {
        projectId,
        status: { not: ProjectMaterialStatus.CANCELLED },
      },
      include: allocationInclude,
      orderBy: { createdAt: 'desc' },
    });
  }
}
