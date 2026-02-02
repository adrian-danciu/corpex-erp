import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceInput } from './dto/create-invoice.input';
import { UpdateInvoiceStatusInput } from './dto/update-invoice-status.input';
import { Invoice } from './entities/invoice.entity';

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
        currency: input.currency,
        notes: input.notes,
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

  async findAll(): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      include: invoiceInclude,
      orderBy: { createdAt: 'desc' },
    });
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
}
