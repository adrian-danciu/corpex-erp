import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceStatusInput } from './dto/update-invoice-status.input';
import { Invoice } from './entities/invoice.entity';
import { FinanceOverview } from './entities/finance-overview.entity';
import { InvoiceLineDraft } from './entities/invoice-line-draft.entity';
import { InvoiceSourceValidationService } from './invoice-source-validation.service';
import { ProjectInvoiceCostsService } from './project-invoice-costs.service';
import { PaginationInput } from '../common/dto/pagination.input';
import { IPaginatedType } from '../common/dto/pagination-result.dto';
import { toPaginatedResult } from '../common/pagination';
import { InvoiceStatus, Prisma } from '@prisma/client';

const invoiceInclude = {
  partner: true,
  supplier: true,
  items: true,
  payments: { include: { createdBy: true } },
  createdBy: true,
} as const;

const MANUAL_STATUS_TRANSITIONS: Partial<
  Record<InvoiceStatus, ReadonlySet<InvoiceStatus>>
> = {
  [InvoiceStatus.DRAFT]: new Set([
    InvoiceStatus.SENT,
    InvoiceStatus.CANCELLED,
  ]),
  [InvoiceStatus.SENT]: new Set([InvoiceStatus.CANCELLED]),
  [InvoiceStatus.OVERDUE]: new Set([InvoiceStatus.CANCELLED]),
};

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sourceValidation: InvoiceSourceValidationService,
    private readonly projectInvoiceCosts: ProjectInvoiceCostsService,
  ) {}

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

    const sources = this.sourceValidation.prepare(input);

    return this.prisma.$transaction(
      async (transaction) => {
        await this.sourceValidation.validate(transaction, input, sources);

        return transaction.invoice.create({
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async findAll(
    pagination: PaginationInput,
    isClientInvoice?: boolean,
  ): Promise<IPaginatedType<Invoice>> {
    const where =
      typeof isClientInvoice === 'boolean' ? { isClientInvoice } : undefined;

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        include: invoiceInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return toPaginatedResult(items, total, pagination);
  }

  async findOne(id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
  }

  async getFinanceOverview(): Promise<FinanceOverview> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const outstandingStatuses = [
      InvoiceStatus.SENT,
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.OVERDUE,
    ];

    const [clientInvoices, supplierInvoices, overdueInvoices, invoicesThisMonth] =
      await Promise.all([
        this.prisma.invoice.findMany({
          where: {
            isClientInvoice: true,
            status: { in: outstandingStatuses },
          },
          select: { total: true, paidAmount: true },
        }),
        this.prisma.invoice.findMany({
          where: {
            isClientInvoice: false,
            status: { in: outstandingStatuses },
          },
          select: { total: true, paidAmount: true },
        }),
        this.prisma.invoice.findMany({
          where: { status: InvoiceStatus.OVERDUE },
          select: { total: true, paidAmount: true },
        }),
        this.prisma.invoice.count({
          where: {
            issueDate: { gte: startOfMonth, lte: endOfMonth },
            status: { not: InvoiceStatus.CANCELLED },
          },
        }),
      ]);

    const outstandingTotal = (
      invoices: Array<{ total: number; paidAmount: number }>,
    ) =>
      invoices.reduce(
        (sum, invoice) => sum + Math.max(0, invoice.total - invoice.paidAmount),
        0,
      );

    return {
      totalReceivable: outstandingTotal(clientInvoices),
      totalPayable: outstandingTotal(supplierInvoices),
      overdueAmount: outstandingTotal(overdueInvoices),
      invoicesThisMonth,
    };
  }

  async updateStatus(input: UpdateInvoiceStatusInput): Promise<Invoice> {
    const invoice = await this.findOne(input.id);
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${input.id} not found`);
    }

    if (invoice.status === input.status) {
      return invoice;
    }

    const allowedTransitions = MANUAL_STATUS_TRANSITIONS[invoice.status];
    if (!allowedTransitions?.has(input.status)) {
      throw new BadRequestException(
        `Invoice status cannot change from ${invoice.status} to ${input.status}`,
      );
    }

    if (
      input.status === InvoiceStatus.CANCELLED &&
      (invoice.paidAmount > 0 || invoice.payments.length > 0)
    ) {
      throw new BadRequestException(
        'Invoices with recorded payments cannot be cancelled',
      );
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

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft invoices can be permanently deleted; cancel issued invoices instead',
      );
    }

    if (invoice.paidAmount > 0 || invoice.payments.length > 0) {
      throw new BadRequestException(
        'Invoices with recorded payments cannot be deleted',
      );
    }

    return this.prisma.invoice.delete({
      where: { id },
      include: invoiceInclude,
    });
  }

  async projectCostsForInvoice(projectId: string): Promise<InvoiceLineDraft[]> {
    return this.projectInvoiceCosts.getDrafts(projectId);
  }
}
