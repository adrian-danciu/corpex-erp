import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  InvoiceStatus,
  PaymentMethod,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let tx: {
    invoice: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    payment: {
      create: jest.Mock;
    };
  };
  let prisma: {
    $transaction: jest.Mock;
  };
  let service: PaymentsService;

  const input = {
    invoiceId: 'invoice-1',
    amount: 40,
    paymentDate: new Date('2026-06-07T00:00:00.000Z'),
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    reference: 'PAY-1',
  };

  beforeEach(() => {
    tx = {
      invoice: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        create: jest.fn(),
      },
    };
    prisma = {
      $transaction: jest.fn(
        (
          callback: (client: typeof tx) => unknown,
          _options: { isolationLevel: Prisma.TransactionIsolationLevel },
        ) => callback(tx),
      ),
    };
    service = new PaymentsService(prisma as unknown as PrismaService);
  });

  it('creates a payment and updates the invoice in one serializable transaction', async () => {
    tx.invoice.findUnique.mockResolvedValue({
      id: input.invoiceId,
      total: 100,
      paidAmount: 20,
      status: InvoiceStatus.SENT,
    });
    tx.payment.create.mockResolvedValue({ id: 'payment-1' });

    await expect(service.create(input, 'user-1')).resolves.toEqual({
      id: 'payment-1',
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(tx.payment.create).toHaveBeenCalledWith({
      data: {
        invoiceId: input.invoiceId,
        amount: input.amount,
        paymentDate: input.paymentDate,
        paymentMethod: input.paymentMethod,
        reference: input.reference,
        notes: undefined,
        createdById: 'user-1',
      },
      include: { createdBy: true },
    });
    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: input.invoiceId },
      data: {
        paidAmount: 60,
        status: InvoiceStatus.PARTIALLY_PAID,
      },
    });
  });

  it('marks the invoice paid when the payment covers the remaining balance', async () => {
    tx.invoice.findUnique.mockResolvedValue({
      id: input.invoiceId,
      total: 100,
      paidAmount: 60,
      status: InvoiceStatus.PARTIALLY_PAID,
    });
    tx.payment.create.mockResolvedValue({ id: 'payment-1' });

    await service.create(input, 'user-1');

    expect(tx.invoice.update).toHaveBeenCalledWith({
      where: { id: input.invoiceId },
      data: {
        paidAmount: 100,
        status: InvoiceStatus.PAID,
      },
    });
  });

  it('rejects overpayments before creating a payment', async () => {
    tx.invoice.findUnique.mockResolvedValue({
      id: input.invoiceId,
      total: 50,
      paidAmount: 20,
      status: InvoiceStatus.PARTIALLY_PAID,
    });

    await expect(service.create(input, 'user-1')).rejects.toThrow(
      BadRequestException,
    );

    expect(tx.payment.create).not.toHaveBeenCalled();
    expect(tx.invoice.update).not.toHaveBeenCalled();
  });

  it('rejects payments for missing invoices', async () => {
    tx.invoice.findUnique.mockResolvedValue(null);

    await expect(service.create(input, 'user-1')).rejects.toThrow(
      NotFoundException,
    );

    expect(tx.payment.create).not.toHaveBeenCalled();
    expect(tx.invoice.update).not.toHaveBeenCalled();
  });

  it.each([
    InvoiceStatus.DRAFT,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.PAID,
  ])('rejects payments for invoices with status %s', async (status) => {
    tx.invoice.findUnique.mockResolvedValue({
      id: input.invoiceId,
      total: 100,
      paidAmount: status === InvoiceStatus.PAID ? 100 : 0,
      status,
    });

    await expect(service.create(input, 'user-1')).rejects.toThrow(
      `Payments cannot be recorded for an invoice with status ${status}`,
    );

    expect(tx.payment.create).not.toHaveBeenCalled();
    expect(tx.invoice.update).not.toHaveBeenCalled();
  });

  it('rejects non-positive amounts before opening a transaction', async () => {
    await expect(
      service.create({ ...input, amount: 0 }, 'user-1'),
    ).rejects.toThrow(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
