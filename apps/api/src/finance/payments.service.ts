import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentInput } from './dto/create-payment.input';
import { Payment } from './entities/payment.entity';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreatePaymentInput, userId: string): Promise<Payment> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: input.invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(
        `Invoice with ID ${input.invoiceId} not found`,
      );
    }

    const remainingAmount = invoice.total - invoice.paidAmount;
    if (input.amount > remainingAmount) {
      throw new BadRequestException(
        `Payment amount (${input.amount}) exceeds remaining balance (${remainingAmount})`,
      );
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        paymentDate: input.paymentDate,
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        notes: input.notes,
        createdById: userId,
      },
      include: { createdBy: true },
    });

    // Update invoice paidAmount and status
    const newPaidAmount = invoice.paidAmount + input.amount;
    let newStatus: InvoiceStatus = invoice.status;

    if (newPaidAmount >= invoice.total) {
      newStatus = InvoiceStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    await this.prisma.invoice.update({
      where: { id: input.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    return payment;
  }
}
