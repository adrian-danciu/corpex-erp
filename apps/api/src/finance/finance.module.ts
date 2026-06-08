import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PartnersResolver } from './partners.resolver';
import { InvoicesResolver } from './invoices.resolver';
import { PaymentsResolver } from './payments.resolver';
import { PartnersService } from './partners.service';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from './payments.service';
import { InvoiceSourceValidationService } from './invoice-source-validation.service';
import { ProjectInvoiceCostsService } from './project-invoice-costs.service';

@Module({
  imports: [PrismaModule],
  providers: [
    PartnersResolver,
    InvoicesResolver,
    PaymentsResolver,
    PartnersService,
    InvoicesService,
    PaymentsService,
    InvoiceSourceValidationService,
    ProjectInvoiceCostsService,
  ],
  exports: [PartnersService, InvoicesService, PaymentsService],
})
export class FinanceModule {}
