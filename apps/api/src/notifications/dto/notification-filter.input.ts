import { Field, InputType } from '@nestjs/graphql';
import { NotificationType } from '@prisma/client';

@InputType()
export class NotificationFilterInput {
  @Field({ nullable: true })
  isRead?: boolean;

  @Field(() => NotificationType, { nullable: true })
  type?: NotificationType;
}
