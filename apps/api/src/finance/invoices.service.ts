import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceStatusInput } from './dto/update-invoice-status.input';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLineDraft } from './entities/invoice-line-draft.entity';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { InvoiceItemSourceType, ProjectMaterialStatus, ProjectServiceStatus } from '@prisma/client';

const invoiceInclude = {
  partner: true,
  supplier: true,
  items: true,
  payments: { include: { createdBy: true } },
  createdBy: true,
} as const;

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateInvoiceInput, userId: string): Promise<Invoice> {
    // Calculate totals from items
    const itemsData = input.items.map((item) => {
      const amount = item.quantity * item.unitPrice;
      const vatAmount = amount * (item.vatRate / 100);
      return {
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        amount,
        vatAmount,
        projectId: item.projectId ?? input.projectId ?? null,
        sourceType: item.sourceType ?? null,
        sourceId: item.sourceId ?? null,
      };
    });

    const subtotal = itemsData.reduce((sum, item) => sum + item.amount, 0);
    const vatTotal = itemsData.reduce((sum, item) => sum + item.vatAmount, 0);
    const total = subtotal + vatTotal;

    return this.prisma.invoice.create({
      data: {
        series: input.series,
        invoiceType: input.invoiceType,
        partnerId: input.partnerId,
        supplierId: input.isClientInvoice ? undefined : input.partnerId,
        isClientInvoice: input.isClientInvoice,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        deliveryDate: input.deliveryDate,
        currency: 'EUR',
        notes: input.notes,
        projectId: input.projectId ?? null,
        purchaseOrderId: input.purchaseOrderId ?? null,
        purchaseReceiptId: input.purchaseReceiptId ?? null,
        subtotal,
        vatTotal,
        total,
        createdById: userId,
        items: {
          create: itemsData,
        },
      },
      include: invoiceInclude,
    });
  }

  async findAll(pagination: PaginationInput): Promise<IPaginatedType<Invoice>> {
    const { skip, take } = pagination;
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        skip,
        take,
        include: invoiceInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count(),
    ]);

    return {
      items,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  async findOne(id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
  }

  async updateStatus(input: UpdateInvoiceStatusInput): Promise<Invoice> {
    const invoice = await this.findOne(input.id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${input.id} not found`);
    }

    return this.prisma.invoice.update({
      where: { id: input.id },
      data: { status: input.status },
      include: invoiceInclude,
    });
  }

  async remove(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return this.prisma.invoice.delete({
      where: { id },
      include: invoiceInclude,
    });
  }

  async projectCostsForInvoice(projectId: string): Promise<InvoiceLineDraft[]> {
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
        invoice: { status: { not: 'CANCELLED' } },
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

    for (const m of materials) {
      if (billed.has(`${InvoiceItemSourceType.PROJECT_MATERIAL}:${m.id}`)) {
        continue;
      }
      const issuedQty = m.movements.reduce((acc, mv) => acc + mv.quantity, 0);
      if (issuedQty <= 0) continue;
      const totalCost = m.movements.reduce(
        (acc, mv) => acc + mv.quantity * (mv.unitCost ?? 0),
        0,
      );
      const unitPrice = issuedQty > 0 ? totalCost / issuedQty : 0;
      const amount = issuedQty * unitPrice;
      const vatAmount = amount * (defaultVatRate / 100);
      drafts.push({
        description: `${m.product.name} (issued from ${m.warehouse.code})`,
        quantity: issuedQty,
        unit: m.product.unit,
        unitPrice,
        vatRate: defaultVatRate,
        source: `project-material:${m.id}`,
        sourceType: InvoiceItemSourceType.PROJECT_MATERIAL,
        sourceId: m.id,
        amount,
        vatAmount,
        total: amount + vatAmount,
      });
    }

    for (const s of services) {
      if (billed.has(`${InvoiceItemSourceType.PROJECT_SERVICE}:${s.id}`)) {
        continue;
      }
      const amount = s.quantity * s.unitPrice;
      const vatAmount = amount * (s.vatRate / 100);
      drafts.push({
        description: s.description,
        quantity: s.quantity,
        unit: s.unit,
        unitPrice: s.unitPrice,
        vatRate: s.vatRate,
        source: `project-service:${s.id}`,
        sourceType: InvoiceItemSourceType.PROJECT_SERVICE,
        sourceId: s.id,
        amount,
        vatAmount,
        total: amount + vatAmount,
      });
    }

    for (const e of vehicleExpenses) {
      if (billed.has(`${InvoiceItemSourceType.VEHICLE_EXPENSE}:${e.id}`)) {
        continue;
      }
      const amount = e.amount;
      const vatAmount = amount * (defaultVatRate / 100);
      drafts.push({
        description: `${e.type} — ${e.vehicle.plateNumber} — ${e.date.toISOString().split('T')[0]}`,
        quantity: 1,
        unit: 'service',
        unitPrice: e.amount,
        vatRate: defaultVatRate,
        source: `vehicle-expense:${e.id}`,
        sourceType: InvoiceItemSourceType.VEHICLE_EXPENSE,
        sourceId: e.id,
        amount,
        vatAmount,
        total: amount + vatAmount,
      });
    }

    return drafts;
  }
}
