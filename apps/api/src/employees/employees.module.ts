import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { LeaveRequestsService } from './leave-requests.service';
import { EmployeesResolver } from './employees.resolver';
import { LeaveRequestsResolver } from './leave-requests.resolver';
import { EmployeeDocumentsResolver } from './employee-documents.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmployeeDocumentsService } from './employee-documents.service';
import { EmployeeDocumentsUploadController } from './employee-documents-upload.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [EmployeeDocumentsUploadController],
  providers: [
    EmployeesResolver,
    LeaveRequestsResolver,
    EmployeeDocumentsResolver,
    EmployeesService,
    LeaveRequestsService,
    EmployeeDocumentsService,
  ],
  exports: [EmployeesService, LeaveRequestsService, EmployeeDocumentsService],
})
export class EmployeesModule {}
