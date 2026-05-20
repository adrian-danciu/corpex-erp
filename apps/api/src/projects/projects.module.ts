import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StockModule } from '../stock/stock.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectFeedResolver } from './project-feed.resolver';
import { ProjectFeedService } from './project-feed.service';
import { ProjectMaterialsResolver } from './project-materials.resolver';
import { ProjectMaterialsService } from './project-materials.service';
import { ProjectMembersResolver } from './project-members.resolver';
import { ProjectMembersService } from './project-members.service';
import { ProjectTaskCommentsResolver } from './project-task-comments.resolver';
import { ProjectTaskCommentsService } from './project-task-comments.service';
import { ProjectServicesResolver } from './project-services.resolver';
import { ProjectServicesService } from './project-services.service';
import { ProjectTasksResolver } from './project-tasks.resolver';
import { ProjectTasksService } from './project-tasks.service';
import { ProjectVehiclesResolver } from './project-vehicles.resolver';
import { ProjectVehiclesService } from './project-vehicles.service';
import { ProjectUploadsController } from './project-uploads.controller';
import { ProjectsResolver } from './projects.resolver';
import { ProjectsService } from './projects.service';
import { ProjectAccessGuard } from './guards/project-access.guard';

@Module({
  imports: [PrismaModule, StockModule, NotificationsModule],
  controllers: [ProjectUploadsController],
  providers: [
    ProjectAccessGuard,
    ProjectsService,
    ProjectsResolver,
    ProjectMembersService,
    ProjectMembersResolver,
    ProjectMaterialsService,
    ProjectMaterialsResolver,
    ProjectServicesService,
    ProjectServicesResolver,
    ProjectVehiclesService,
    ProjectVehiclesResolver,
    ProjectTasksService,
    ProjectTasksResolver,
    ProjectTaskCommentsService,
    ProjectTaskCommentsResolver,
    ProjectFeedService,
    ProjectFeedResolver,
  ],
  exports: [ProjectsService, ProjectVehiclesService],
})
export class ProjectsModule {}
