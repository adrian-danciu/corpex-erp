import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvoiceItemSourceType,
  InvoiceStatus,
  Prisma,
  ProjectMaterialStatus,
  ProjectServiceStatus,
} from '@prisma/client';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { CreateInvoiceItemInput } from './dto/create-invoice-item.input';

const PROJECT_SOURCE_TYPES = new Set<InvoiceItemSourceType>([
  InvoiceItemSourceType.PROJECT_MATERIAL,
  InvoiceItemSourceType.PROJECT_SERVICE,
  InvoiceItemSourceType.VEHICLE_EXPENSE,
]);

interface ProjectSource {
  sourceType: InvoiceItemSourceType;
  sourceId: string;
}

export interface PreparedInvoiceSources {
  projectSources: ProjectSource[];
  receiptLineItems: CreateInvoiceItemInput[];
  receiptLineIds: string[];
}

@Injectable()
export class InvoiceSourceValidationService {
  prepare(input: CreateInvoiceInput): PreparedInvoiceSources {
    for (const item of input.items) {
      if (item.sourceType && item.sourceType !== InvoiceItemSourceType.MANUAL) {
        if (!item.sourceId) {
          throw new BadRequestException(
            `Invoice source ${item.sourceType} requires a source ID`,
          );
        }
      } else if (item.sourceId) {
        throw new BadRequestException(
          'Manual invoice items cannot include a source ID',
        );
      }
    }

    const sourcedItems = input.items.filter(
      (
        item,
      ): item is CreateInvoiceItemInput & {
        sourceType: InvoiceItemSourceType;
        sourceId: string;
      } =>
        Boolean(
          item.sourceType &&
            item.sourceType !== InvoiceItemSourceType.MANUAL &&
            item.sourceId,
        ),
    );
    const sourceKeys = sourcedItems.map(
      (item) => `${item.sourceType}:${item.sourceId}`,
    );
    if (new Set(sourceKeys).size !== sourceKeys.length) {
      throw new BadRequestException(
        'An invoice source can only appear once on an invoice',
      );
    }

    const projectSourceItems = sourcedItems.filter((item) =>
      PROJECT_SOURCE_TYPES.has(item.sourceType),
    );
    if (projectSourceItems.length > 0 && !input.isClientInvoice) {
      throw new BadRequestException(
        'Project sources can only be added to client invoices',
      );
    }
    if (projectSourceItems.length > 0 && !input.projectId) {
      throw new BadRequestException(
        'A project is required when invoicing project sources',
      );
    }
    if (
      projectSourceItems.some(
        (item) => item.projectId && item.projectId !== input.projectId,
      )
    ) {
      throw new BadRequestException(
        'Project invoice sources must use the invoice project',
      );
    }

    const receiptLineItems = sourcedItems.filter(
      (item) =>
        item.sourceType === InvoiceItemSourceType.PURCHASE_RECEIPT_LINE,
    );
    const receiptLineIds = receiptLineItems.map((item) => item.sourceId);

    if (receiptLineIds.length > 0 && input.isClientInvoice) {
      throw new BadRequestException(
        'Purchase receipt lines can only be added to supplier invoices',
      );
    }
    if (receiptLineIds.length > 0 && !input.purchaseOrderId) {
      throw new BadRequestException(
        'A purchase order is required when invoicing purchase receipt lines',
      );
    }

    return {
      projectSources: projectSourceItems.map((item) => ({
        sourceType: item.sourceType,
        sourceId: item.sourceId,
      })),
      receiptLineItems,
      receiptLineIds,
    };
  }

  async validate(
    transaction: Prisma.TransactionClient,
    input: CreateInvoiceInput,
    sources: PreparedInvoiceSources,
  ): Promise<void> {
    if (sources.projectSources.length > 0) {
      const project = await transaction.project.findUnique({
        where: { id: input.projectId },
        select: { partnerId: true },
      });
      if (!project) {
        throw new NotFoundException(
          `Project with ID ${input.projectId} not found`,
        );
      }
      if (project.partnerId !== input.partnerId) {
        throw new BadRequestException(
          'The project does not belong to the selected client',
        );
      }

      await this.validateProjectSources(
        transaction,
        input.projectId!,
        sources.projectSources,
      );
    }

    if (!input.isClientInvoice && input.purchaseOrderId) {
      const purchaseOrder = await transaction.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        select: { supplierId: true },
      });

      if (!purchaseOrder) {
        throw new NotFoundException(
          `Purchase order with ID ${input.purchaseOrderId} not found`,
        );
      }
      if (purchaseOrder.supplierId !== input.partnerId) {
        throw new BadRequestException(
          'The purchase order does not belong to the selected supplier',
        );
      }
    }

    if (sources.receiptLineIds.length > 0) {
      await this.validateReceiptLines(transaction, input, sources);
    }
  }

  private async validateReceiptLines(
    transaction: Prisma.TransactionClient,
    input: CreateInvoiceInput,
    sources: PreparedInvoiceSources,
  ): Promise<void> {
    const receiptLines = await transaction.purchaseOrderReceiptLine.findMany({
      where: {
        id: { in: sources.receiptLineIds },
        receipt: { orderId: input.purchaseOrderId },
      },
      select: { id: true, qtyReceived: true },
    });

    if (receiptLines.length !== sources.receiptLineIds.length) {
      throw new BadRequestException(
        'One or more purchase receipt lines do not belong to the selected purchase order',
      );
    }

    const invoicedLines = await transaction.invoiceItem.findMany({
      where: {
        sourceType: InvoiceItemSourceType.PURCHASE_RECEIPT_LINE,
        sourceId: { in: sources.receiptLineIds },
        invoice: { status: { not: InvoiceStatus.CANCELLED } },
      },
      select: { sourceId: true, quantity: true },
    });

    const receivedQuantities = new Map(
      receiptLines.map((line) => [line.id, line.qtyReceived]),
    );
    const invoicedQuantities = new Map<string, number>();
    for (const line of invoicedLines) {
      if (!line.sourceId) continue;
      invoicedQuantities.set(
        line.sourceId,
        (invoicedQuantities.get(line.sourceId) ?? 0) + line.quantity,
      );
    }

    const excessiveLine = sources.receiptLineItems.find((item) => {
      const received = receivedQuantities.get(item.sourceId!)!;
      const alreadyInvoiced = invoicedQuantities.get(item.sourceId!) ?? 0;
      return item.quantity > received - alreadyInvoiced;
    });
    if (excessiveLine) {
      throw new BadRequestException(
        'An invoiced receipt quantity cannot exceed its remaining uninvoiced quantity',
      );
    }
  }

  private async validateProjectSources(
    transaction: Prisma.TransactionClient,
    projectId: string,
    items: ProjectSource[],
  ): Promise<void> {
    const idsFor = (sourceType: InvoiceItemSourceType) =>
      items
        .filter((item) => item.sourceType === sourceType)
        .map((item) => item.sourceId);

    const materialIds = idsFor(InvoiceItemSourceType.PROJECT_MATERIAL);
    const serviceIds = idsFor(InvoiceItemSourceType.PROJECT_SERVICE);
    const expenseIds = idsFor(InvoiceItemSourceType.VEHICLE_EXPENSE);

    const [materials, services, expenses, billedSources] = await Promise.all([
      transaction.projectMaterial.findMany({
        where: {
          id: { in: materialIds },
          projectId,
          status: {
            in: [
              ProjectMaterialStatus.PARTIALLY_ISSUED,
              ProjectMaterialStatus.FULLY_ISSUED,
            ],
          },
        },
        select: { id: true },
      }),
      transaction.projectService.findMany({
        where: {
          id: { in: serviceIds },
          projectId,
          billable: true,
          status: ProjectServiceStatus.DELIVERED,
        },
        select: { id: true },
      }),
      transaction.vehicleExpense.findMany({
        where: { id: { in: expenseIds }, projectId },
        select: { id: true },
      }),
      transaction.invoiceItem.findMany({
        where: {
          OR: items.map((item) => ({
            sourceType: item.sourceType,
            sourceId: item.sourceId,
          })),
          invoice: { status: { not: InvoiceStatus.CANCELLED } },
        },
        select: { sourceType: true, sourceId: true },
      }),
    ]);

    if (
      materials.length !== materialIds.length ||
      services.length !== serviceIds.length ||
      expenses.length !== expenseIds.length
    ) {
      throw new BadRequestException(
        'One or more project invoice sources are invalid, unavailable, or belong to another project',
      );
    }
    if (billedSources.length > 0) {
      throw new BadRequestException(
        'One or more project invoice sources have already been invoiced',
      );
    }
  }
}
