import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentInput } from './dto/create-payment.input';
import { Payment } from './entities/payment.entity';

const PAYABLE_INVOICE_STATUSES = new Set<InvoiceStatus>([
  InvoiceStatus.SENT,
  InvoiceStatus.PARTIALLY_PAID,
  InvoiceStatus.OVERDUE,
]);

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreatePaymentInput, userId: string): Promise<Payment> {
    if (input.amount <= 0) {
      throw new BadRequestException(
        `Payment amount (${input.amount}) must be greater than zero`,
      );
    }

    return this.prisma.$transaction(
      async (transaction) => {
        const invoice = await transaction.invoice.findUnique({
          where: { id: input.invoiceId },
        });

        if (!invoice) {
          throw new NotFoundException(
            `Invoice with ID ${input.invoiceId} not found`,
          );
        }

        if (!PAYABLE_INVOICE_STATUSES.has(invoice.status)) {
          throw new BadRequestException(
            `Payments cannot be recorded for an invoice with status ${invoice.status}`,
          );
        }

        const remainingAmount = invoice.total - invoice.paidAmount;
        if (remainingAmount <= 0) {
          throw new BadRequestException('Invoice has no remaining balance');
        }
        if (input.amount > remainingAmount) {
          throw new BadRequestException(
            `Payment amount (${input.amount}) exceeds remaining balance (${remainingAmount})`,
          );
        }

        const payment = await transaction.payment.create({
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

        const newPaidAmount = invoice.paidAmount + input.amount;
        let newStatus: InvoiceStatus = invoice.status;

        if (newPaidAmount >= invoice.total) {
          newStatus = InvoiceStatus.PAID;
        } else if (newPaidAmount > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        }

        await transaction.invoice.update({
          where: { id: input.invoiceId },
          data: {
            paidAmount: newPaidAmount,
            status: newStatus,
          },
        });

        return payment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}
