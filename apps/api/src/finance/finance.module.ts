import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PartnersResolver } from './partners.resolver';
import { InvoicesResolver } from './invoices.resolver';
import { PaymentsResolver } from './payments.resolver';
import { PartnersService } from './partners.service';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule],
  providers: [
    PartnersResolver,
    InvoicesResolver,
    PaymentsResolver,
    PartnersService,
    InvoicesService,
    PaymentsService,
  ],
  exports: [PartnersService, InvoicesService, PaymentsService],
})
export class FinanceModule {}
