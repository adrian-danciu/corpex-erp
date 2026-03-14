import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VehiclesResolver } from './vehicles.resolver';
import { VehicleDocumentsResolver } from './vehicle-documents.resolver';
import { MileageResolver } from './mileage.resolver';
import { LeasesResolver } from './leases.resolver';
import { ExpensesResolver } from './expenses.resolver';
import { VehiclesService } from './vehicles.service';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { MileageService } from './mileage.service';
import { LeasesService } from './leases.service';
import { ExpensesService } from './expenses.service';

@Module({
  imports: [PrismaModule],
  providers: [
    VehiclesResolver,
    VehicleDocumentsResolver,
    MileageResolver,
    LeasesResolver,
    ExpensesResolver,
    VehiclesService,
    VehicleDocumentsService,
    MileageService,
    LeasesService,
    ExpensesService,
  ],
  exports: [VehiclesService, VehicleDocumentsService],
})
export class FleetModule {}
