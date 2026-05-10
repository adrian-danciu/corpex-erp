import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { NotificationsScheduler } from './notifications.scheduler';

@Module({
  imports: [PrismaModule],
  providers: [
    NotificationsService,
    NotificationsResolver,
    NotificationsScheduler,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
