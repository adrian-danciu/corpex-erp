import { Injectable, NotFoundException } from '@nestjs/common';
import {
  InvoiceItemSourceType,
  InvoiceStatus,
  ProjectMaterialStatus,
  ProjectServiceStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceLineDraft } from './entities/invoice-line-draft.entity';

@Injectable()
export class ProjectInvoiceCostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDrafts(projectId: string): Promise<InvoiceLineDraft[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const settings = await this.prisma.companySettings.findUnique({
      where: { id: 'singleton' },
    });
    const defaultVatRate = settings?.defaultVatRate ?? 19;

    const billedRows = await this.prisma.invoiceItem.findMany({
      where: {
        projectId,
        sourceType: {
          in: [
            InvoiceItemSourceType.PROJECT_MATERIAL,
            InvoiceItemSourceType.PROJECT_SERVICE,
            InvoiceItemSourceType.VEHICLE_EXPENSE,
          ],
        },
        invoice: { status: { not: InvoiceStatus.CANCELLED } },
      },
      select: { sourceType: true, sourceId: true },
    });
    const billed = new Set(
      billedRows
        .filter((row) => row.sourceType && row.sourceId)
        .map((row) => `${row.sourceType}:${row.sourceId}`),
    );

    const [materials, services, vehicleExpenses] = await Promise.all([
      this.prisma.projectMaterial.findMany({
        where: {
          projectId,
          status: {
            in: [
              ProjectMaterialStatus.PARTIALLY_ISSUED,
              ProjectMaterialStatus.FULLY_ISSUED,
            ],
          },
        },
        include: {
          product: true,
          warehouse: true,
          movements: { where: { type: 'OUT' } },
        },
      }),
      this.prisma.projectService.findMany({
        where: {
          projectId,
          billable: true,
          status: ProjectServiceStatus.DELIVERED,
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.vehicleExpense.findMany({
        where: { projectId },
        include: { vehicle: true },
      }),
    ]);

    const drafts: InvoiceLineDraft[] = [];

    for (const material of materials) {
      if (
        billed.has(
          `${InvoiceItemSourceType.PROJECT_MATERIAL}:${material.id}`,
        )
      ) {
        continue;
      }
      const issuedQty = material.movements.reduce(
        (sum, movement) => sum + movement.quantity,
        0,
      );
      if (issuedQty <= 0) continue;
      const totalCost = material.movements.reduce(
        (sum, movement) =>
          sum + movement.quantity * (movement.unitCost ?? 0),
        0,
      );
      const unitPrice = totalCost / issuedQty;
      const amount = issuedQty * unitPrice;
      const vatAmount = amount * (defaultVatRate / 100);
      drafts.push({
        description: `${material.product.name} (issued from ${material.warehouse.code})`,
        quantity: issuedQty,
        unit: material.product.unit,
        unitPrice,
        vatRate: defaultVatRate,
        source: `project-material:${material.id}`,
        sourceType: InvoiceItemSourceType.PROJECT_MATERIAL,
        sourceId: material.id,
        amount,
        vatAmount,
        total: amount + vatAmount,
      });
    }

    for (const service of services) {
      if (
        billed.has(`${InvoiceItemSourceType.PROJECT_SERVICE}:${service.id}`)
      ) {
        continue;
      }
      const amount = service.quantity * service.unitPrice;
      const vatAmount = amount * (service.vatRate / 100);
      drafts.push({
        description: service.description,
        quantity: service.quantity,
        unit: service.unit,
        unitPrice: service.unitPrice,
        vatRate: service.vatRate,
        source: `project-service:${service.id}`,
        sourceType: InvoiceItemSourceType.PROJECT_SERVICE,
        sourceId: service.id,
        amount,
        vatAmount,
        total: amount + vatAmount,
      });
    }

    for (const expense of vehicleExpenses) {
      if (
        billed.has(`${InvoiceItemSourceType.VEHICLE_EXPENSE}:${expense.id}`)
      ) {
        continue;
      }
      const amount = expense.amount;
      const vatAmount = amount * (defaultVatRate / 100);
      drafts.push({
        description: `${expense.type} — ${expense.vehicle.plateNumber} — ${expense.date.toISOString().split('T')[0]}`,
        quantity: 1,
        unit: 'service',
        unitPrice: expense.amount,
        vatRate: defaultVatRate,
        source: `vehicle-expense:${expense.id}`,
        sourceType: InvoiceItemSourceType.VEHICLE_EXPENSE,
        sourceId: expense.id,
        amount,
        vatAmount,
        total: amount + vatAmount,
      });
    }

    return drafts;
  }
}
