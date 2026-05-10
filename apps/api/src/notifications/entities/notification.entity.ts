import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { NotificationType, NotificationEntityType } from '@prisma/client';

registerEnumType(NotificationType, { name: 'NotificationType' });
registerEnumType(NotificationEntityType, { name: 'NotificationEntityType' });

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  recipientId: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  body?: string | null;

  @Field(() => String, { nullable: true })
  linkPath?: string | null;

  @Field(() => NotificationEntityType, { nullable: true })
  entityType?: NotificationEntityType | null;

  @Field(() => String, { nullable: true })
  entityId?: string | null;

  @Field()
  isRead: boolean;

  @Field(() => Date, { nullable: true })
  readAt?: Date | null;

  @Field(() => Date)
  createdAt: Date;
}
