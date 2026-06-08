import { BadRequestException } from '@nestjs/common';
import { InvoiceItemSourceType, InvoiceType } from '@prisma/client';
import { InvoiceSourceValidationService } from './invoice-source-validation.service';

describe('InvoiceSourceValidationService', () => {
  const service = new InvoiceSourceValidationService();

  it('rejects duplicate invoice sources before opening a transaction', () => {
    expect(() =>
      service.prepare({
        series: 'SUP',
        invoiceType: InvoiceType.FISCAL,
        partnerId: 'supplier-1',
        isClientInvoice: false,
        issueDate: new Date('2026-06-08T00:00:00.000Z'),
        dueDate: new Date('2026-07-08T00:00:00.000Z'),
        currency: 'EUR',
        purchaseOrderId: 'order-1',
        items: [
          {
            description: 'Cable',
            quantity: 2,
            unit: 'buc',
            unitPrice: 10,
            vatRate: 19,
            sourceType: InvoiceItemSourceType.PURCHASE_RECEIPT_LINE,
            sourceId: 'receipt-line-1',
          },
          {
            description: 'Cable',
            quantity: 3,
            unit: 'buc',
            unitPrice: 10,
            vatRate: 19,
            sourceType: InvoiceItemSourceType.PURCHASE_RECEIPT_LINE,
            sourceId: 'receipt-line-1',
          },
        ],
      }),
    ).toThrow(
      new BadRequestException(
        'An invoice source can only appear once on an invoice',
      ),
    );
  });
});
