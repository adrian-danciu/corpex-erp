import { InvoiceItemSourceType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectInvoiceCostsService } from './project-invoice-costs.service';

describe('ProjectInvoiceCostsService', () => {
  it('builds uninvoiced material drafts from issued stock movements', async () => {
    const prisma = {
      project: { findUnique: jest.fn().mockResolvedValue({ id: 'project-1' }) },
      companySettings: {
        findUnique: jest.fn().mockResolvedValue({ defaultVatRate: 19 }),
      },
      invoiceItem: { findMany: jest.fn().mockResolvedValue([]) },
      projectMaterial: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'material-1',
            product: { name: 'Cable', unit: 'm' },
            warehouse: { code: 'WH-1' },
            movements: [
              { quantity: 2, unitCost: 10 },
              { quantity: 3, unitCost: 14 },
            ],
          },
        ]),
      },
      projectService: { findMany: jest.fn().mockResolvedValue([]) },
      vehicleExpense: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new ProjectInvoiceCostsService(
      prisma as unknown as PrismaService,
    );

    await expect(service.getDrafts('project-1')).resolves.toEqual([
      expect.objectContaining({
        description: 'Cable (issued from WH-1)',
        quantity: 5,
        unitPrice: 12.4,
        vatRate: 19,
        sourceType: InvoiceItemSourceType.PROJECT_MATERIAL,
        sourceId: 'material-1',
        amount: 62,
        vatAmount: 11.78,
        total: 73.78,
      }),
    ]);
  });
});
