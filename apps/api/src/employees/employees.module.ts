import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { LeaveRequestsService } from './leave-requests.service';
import { EmployeesResolver } from './employees.resolver';
import { LeaveRequestsResolver } from './leave-requests.resolver';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    EmployeesResolver,
    LeaveRequestsResolver,
    EmployeesService,
    LeaveRequestsService,
  ],
  exports: [EmployeesService, LeaveRequestsService],
})
export class EmployeesModule {}
