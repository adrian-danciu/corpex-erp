import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { PaginatedNotification } from './dto/paginated-notification.dto';
import { NotificationFilterInput } from './dto/notification-filter.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationInput } from '../common/dto/pagination.input';

interface AuthUser {
  id: string;
}

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Query(() => PaginatedNotification, { name: 'myNotifications' })
  @UseGuards(JwtAuthGuard)
  async myNotifications(
    @CurrentUser() user: AuthUser,
    @Args('pagination', { nullable: true, type: () => PaginationInput })
    pagination?: PaginationInput,
    @Args('filter', { nullable: true, type: () => NotificationFilterInput })
    filter?: NotificationFilterInput,
  ): Promise<PaginatedNotification> {
    return this.notificationsService.myNotifications(
      user.id,
      pagination ?? { skip: 0, take: 10 },
      filter,
    );
  }

  @Query(() => Int, { name: 'myUnreadNotificationCount' })
  @UseGuards(JwtAuthGuard)
  async myUnreadCount(@CurrentUser() user: AuthUser): Promise<number> {
    return this.notificationsService.myUnreadCount(user.id);
  }

  @Mutation(() => Notification, { name: 'markNotificationRead' })
  @UseGuards(JwtAuthGuard)
  async markRead(
    @CurrentUser() user: AuthUser,
    @Args('id') id: string,
  ): Promise<Notification> {
    return this.notificationsService.markRead(user.id, id);
  }

  @Mutation(() => Int, { name: 'markAllNotificationsRead' })
  @UseGuards(JwtAuthGuard)
  async markAllRead(@CurrentUser() user: AuthUser): Promise<number> {
    return this.notificationsService.markAllRead(user.id);
  }
}
