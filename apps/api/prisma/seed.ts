import {
  PrismaClient,
  PartnerType,
  InvoiceType,
  InvoiceStatus,
  Role,
  StockMovementType,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create a finance user (or find existing)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@corpex.ro' },
    update: {},
    create: {
      firstName: 'Finance',
      lastName: 'Admin',
      email: 'finance@corpex.ro',
      password: hashedPassword,
      role: Role.USER,
    },
  });

  console.log(`Created/found user: ${financeUser.email}`);

  // 2. Create partners
  const partnersData = [
    {
      name: 'SC Alpha Distribution SRL',
      cui: 'RO12345678',
      regCom: 'J40/1234/2020',
      address: 'Str. Industriei 15',
      city: 'Bucuresti',
      country: 'Romania',
      email: 'contact@alpha.ro',
      phone: '021-123-4567',
      contactPerson: 'Ion Popescu',
      partnerType: PartnerType.CLIENT,
      bankName: 'BCR',
      bankAccount: 'RO49RNCB0080000000000001',
    },
    {
      name: 'SC Beta Logistics SA',
      cui: 'RO87654321',
      regCom: 'J40/5678/2019',
      address: 'Bd. Timisoara 100',
      city: 'Bucuresti',
      country: 'Romania',
      email: 'office@beta.ro',
      phone: '021-234-5678',
      contactPerson: 'Maria Ionescu',
      partnerType: PartnerType.BOTH,
      bankName: 'BRD',
      bankAccount: 'RO49BRDE0080000000000002',
    },
    {
      name: 'SC Gamma Services SRL',
      cui: 'RO11223344',
      regCom: 'J40/9012/2021',
      address: 'Str. Victoriei 42',
      city: 'Cluj-Napoca',
      country: 'Romania',
      email: 'info@gamma.ro',
      phone: '0264-123-456',
      contactPerson: 'Andrei Munteanu',
      partnerType: PartnerType.SUPPLIER,
      bankName: 'ING Bank',
      bankAccount: 'RO49INGB0080000000000003',
    },
    {
      name: 'SC Delta Manufacturing SRL',
      cui: 'RO55667788',
      regCom: 'J40/3456/2018',
      address: 'Str. Fabricii 8',
      city: 'Timisoara',
      country: 'Romania',
      email: 'sales@delta.ro',
      phone: '0256-789-012',
      contactPerson: 'Elena Dragomir',
      partnerType: PartnerType.CLIENT,
      bankName: 'Raiffeisen',
      bankAccount: 'RO49RZBR0080000000000004',
    },
    {
      name: 'SC Epsilon SA',
      cui: 'RO99887766',
      regCom: 'J40/7890/2022',
      address: 'Calea Dorobanti 50',
      city: 'Bucuresti',
      country: 'Romania',
      email: 'contact@epsilon.ro',
      phone: '021-345-6789',
      contactPerson: 'Mihai Stanescu',
      partnerType: PartnerType.SUPPLIER,
      bankName: 'Transilvania',
      bankAccount: 'RO49BTRL0080000000000005',
    },
  ];

  const partners = [];
  for (const data of partnersData) {
    const partner = await prisma.partner.upsert({
      where: { cui: data.cui },
      update: {},
      create: data,
    });
    partners.push(partner);
    console.log(`Created/found partner: ${partner.name}`);
  }

  // 3. Create invoices with items
  // Check if invoices already exist
  const existingInvoices = await prisma.invoice.count();
  if (existingInvoices > 0) {
    console.log(`Skipping invoice seeding — ${existingInvoices} invoices already exist.`);
  } else {
    const invoicesData = [
      {
        series: 'CORP',
        invoiceType: InvoiceType.FISCAL,
        status: InvoiceStatus.SENT,
        partnerId: partners[0].id,
        isClientInvoice: true,
        issueDate: new Date('2026-01-28'),
        dueDate: new Date('2026-02-28'),
        currency: 'EUR',
        createdById: financeUser.id,
        items: [
          { description: 'Consulting services - January 2026', quantity: 40, unit: 'ore', unitPrice: 120, vatRate: 19 },
          { description: 'Software license Q1 2026', quantity: 1, unit: 'buc', unitPrice: 600, vatRate: 19 },
        ],
      },
      {
        series: 'CORP',
        invoiceType: InvoiceType.FISCAL,
        status: InvoiceStatus.PAID,
        partnerId: partners[1].id,
        isClientInvoice: true,
        issueDate: new Date('2026-01-25'),
        dueDate: new Date('2026-02-25'),
        currency: 'EUR',
        createdById: financeUser.id,
        items: [
          { description: 'Logistics management - January', quantity: 1, unit: 'buc', unitPrice: 8500, vatRate: 19 },
          { description: 'Warehouse rent - January', quantity: 1, unit: 'luna', unitPrice: 2214.29, vatRate: 19 },
        ],
      },
      {
        series: 'CORP',
        invoiceType: InvoiceType.FISCAL,
        status: InvoiceStatus.OVERDUE,
        partnerId: partners[2].id,
        isClientInvoice: true,
        issueDate: new Date('2026-01-20'),
        dueDate: new Date('2026-01-30'),
        currency: 'EUR',
        createdById: financeUser.id,
        items: [
          { description: 'IT Support - January 2026', quantity: 20, unit: 'ore', unitPrice: 134.45, vatRate: 19 },
        ],
      },
      {
        series: 'CORP',
        invoiceType: InvoiceType.FISCAL,
        status: InvoiceStatus.PARTIALLY_PAID,
        partnerId: partners[3].id,
        isClientInvoice: true,
        issueDate: new Date('2026-01-15'),
        dueDate: new Date('2026-02-15'),
        currency: 'EUR',
        createdById: financeUser.id,
        items: [
          { description: 'Manufacturing equipment maintenance', quantity: 1, unit: 'buc', unitPrice: 5000, vatRate: 19 },
          { description: 'Replacement parts', quantity: 5, unit: 'buc', unitPrice: 495.80, vatRate: 19 },
        ],
      },
      {
        series: 'CORP',
        invoiceType: InvoiceType.PROFORMA,
        status: InvoiceStatus.DRAFT,
        partnerId: partners[4].id,
        isClientInvoice: true,
        issueDate: new Date('2026-01-10'),
        dueDate: new Date('2026-02-10'),
        currency: 'EUR',
        createdById: financeUser.id,
        items: [
          { description: 'Office supplies - February', quantity: 1, unit: 'buc', unitPrice: 1344.54, vatRate: 19 },
        ],
      },
    ];

    for (const invoiceData of invoicesData) {
      const { items, ...data } = invoiceData;

      const itemsWithTotals = items.map((item) => {
        const amount = item.quantity * item.unitPrice;
        const vatAmount = amount * (item.vatRate / 100);
        return { ...item, amount, vatAmount };
      });

      const subtotal = itemsWithTotals.reduce((sum, i) => sum + i.amount, 0);
      const vatTotal = itemsWithTotals.reduce((sum, i) => sum + i.vatAmount, 0);
      const total = subtotal + vatTotal;

      // Set paidAmount based on status
      let paidAmount = 0;
      if (data.status === InvoiceStatus.PAID) {
        paidAmount = total;
      } else if (data.status === InvoiceStatus.PARTIALLY_PAID) {
        paidAmount = Math.round(total * 0.5 * 100) / 100; // 50% paid
      }

      const invoice = await prisma.invoice.create({
        data: {
          ...data,
          subtotal,
          vatTotal,
          total,
          paidAmount,
          items: {
            create: itemsWithTotals,
          },
        },
      });

      console.log(`Created invoice: ${invoice.series}-${invoice.number} (${data.status}, total: ${total.toFixed(2)} EUR)`);
    }
  }

  // 4. Seed stock & warehouse module data (idempotent)
  const warehousesData = [
    {
      name: 'Depozit Central Bucuresti',
      code: 'WH-BUC-01',
      address: 'Soseaua de Centura 12',
      city: 'Bucuresti',
      country: 'Romania',
    },
    {
      name: 'Depozit Cluj',
      code: 'WH-CJ-01',
      address: 'Str. Industriilor 3',
      city: 'Cluj-Napoca',
      country: 'Romania',
    },
  ];

  const productsData = [
    {
      sku: 'LAP-HP-840',
      name: 'Laptop HP EliteBook 840',
      description: 'Laptop office standard',
      unit: 'pcs',
      category: 'IT Equipment',
      minimumStock: 5,
    },
    {
      sku: 'MON-24-IPS',
      name: 'Monitor 24 inch IPS',
      description: 'Monitor standard office',
      unit: 'pcs',
      category: 'IT Equipment',
      minimumStock: 8,
    },
    {
      sku: 'CHA-ERG-01',
      name: 'Scaun ergonomic',
      description: 'Scaun ergonomic pentru birou',
      unit: 'pcs',
      category: 'Office Furniture',
      minimumStock: 10,
    },
    {
      sku: 'PAP-A4-80',
      name: 'Hartie A4 80g',
      description: 'Top hartie 500 coli',
      unit: 'ream',
      category: 'Office Supplies',
      minimumStock: 40,
    },
    {
      sku: 'CAB-UTP-C6',
      name: 'Cablu UTP Cat6 3m',
      description: 'Cablu retea standard',
      unit: 'pcs',
      category: 'Networking',
      minimumStock: 20,
    },
  ];

  const warehouses = [];
  for (const data of warehousesData) {
    const warehouse = await prisma.warehouse.upsert({
      where: { code: data.code },
      update: {
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
      },
      create: data,
    });
    warehouses.push(warehouse);
    console.log(`Created/found warehouse: ${warehouse.code}`);
  }

  const products = [];
  for (const data of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: data.sku },
      update: {
        name: data.name,
        description: data.description,
        unit: data.unit,
        category: data.category,
        minimumStock: data.minimumStock,
      },
      create: data,
    });
    products.push(product);
    console.log(`Created/found product: ${product.sku}`);
  }

  const warehouseByCode = Object.fromEntries(warehouses.map((w) => [w.code, w]));
  const productBySku = Object.fromEntries(products.map((p) => [p.sku, p]));

  const stockSnapshot = [
    { warehouseCode: 'WH-BUC-01', sku: 'LAP-HP-840', quantity: 12 },
    { warehouseCode: 'WH-BUC-01', sku: 'MON-24-IPS', quantity: 18 },
    { warehouseCode: 'WH-BUC-01', sku: 'CHA-ERG-01', quantity: 9 },
    { warehouseCode: 'WH-BUC-01', sku: 'PAP-A4-80', quantity: 55 },
    { warehouseCode: 'WH-BUC-01', sku: 'CAB-UTP-C6', quantity: 30 },
    { warehouseCode: 'WH-CJ-01', sku: 'LAP-HP-840', quantity: 4 },
    { warehouseCode: 'WH-CJ-01', sku: 'MON-24-IPS', quantity: 6 },
    { warehouseCode: 'WH-CJ-01', sku: 'CHA-ERG-01', quantity: 3 },
    { warehouseCode: 'WH-CJ-01', sku: 'PAP-A4-80', quantity: 28 },
    { warehouseCode: 'WH-CJ-01', sku: 'CAB-UTP-C6', quantity: 14 },
  ];

  for (const row of stockSnapshot) {
    const warehouse = warehouseByCode[row.warehouseCode];
    const product = productBySku[row.sku];
    if (!warehouse || !product) continue;

    await prisma.productStock.upsert({
      where: {
        productId_warehouseId: {
          productId: product.id,
          warehouseId: warehouse.id,
        },
      },
      update: { quantity: row.quantity },
      create: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: row.quantity,
      },
    });
  }

  await prisma.stockMovement.deleteMany({
    where: {
      reference: {
        startsWith: 'SEED-STOCK-',
      },
    },
  });

  const stockMovementsData = [
    {
      reference: 'SEED-STOCK-IN-001',
      warehouseCode: 'WH-BUC-01',
      sku: 'LAP-HP-840',
      type: StockMovementType.IN,
      quantity: 20,
      unitCost: 4200,
      notes: 'Initial stock receipt',
      performedAt: new Date('2026-02-01T10:00:00Z'),
    },
    {
      reference: 'SEED-STOCK-OUT-001',
      warehouseCode: 'WH-BUC-01',
      sku: 'LAP-HP-840',
      type: StockMovementType.OUT,
      quantity: 8,
      unitCost: 4200,
      notes: 'Issued to IT onboarding',
      performedAt: new Date('2026-02-10T12:00:00Z'),
    },
    {
      reference: 'SEED-STOCK-IN-002',
      warehouseCode: 'WH-CJ-01',
      sku: 'MON-24-IPS',
      type: StockMovementType.IN,
      quantity: 10,
      unitCost: 700,
      notes: 'Purchase order reception',
      performedAt: new Date('2026-02-05T09:30:00Z'),
    },
    {
      reference: 'SEED-STOCK-OUT-002',
      warehouseCode: 'WH-CJ-01',
      sku: 'MON-24-IPS',
      type: StockMovementType.OUT,
      quantity: 4,
      unitCost: 700,
      notes: 'Allocated to operations team',
      performedAt: new Date('2026-02-15T16:00:00Z'),
    },
    {
      reference: 'SEED-STOCK-ADJ-001',
      warehouseCode: 'WH-BUC-01',
      sku: 'PAP-A4-80',
      type: StockMovementType.ADJUSTMENT,
      quantity: 2,
      unitCost: 18,
      notes: 'Inventory correction',
      performedAt: new Date('2026-02-20T08:45:00Z'),
    },
  ];

  for (const movement of stockMovementsData) {
    const warehouse = warehouseByCode[movement.warehouseCode];
    const product = productBySku[movement.sku];
    if (!warehouse || !product) continue;

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        type: movement.type,
        quantity: movement.quantity,
        unitCost: movement.unitCost,
        reference: movement.reference,
        notes: movement.notes,
        performedAt: movement.performedAt,
        createdById: financeUser.id,
      },
    });
  }

  for (const product of products) {
    const aggregate = await prisma.productStock.aggregate({
      where: { productId: product.id },
      _sum: { quantity: true },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { currentStock: aggregate._sum.quantity ?? 0 },
    });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
