import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ProjectTaskPriority, ProjectTaskStatus } from '@prisma/client';
import { User } from '../../users/entities/user.entity';

registerEnumType(ProjectTaskStatus, { name: 'ProjectTaskStatus' });
registerEnumType(ProjectTaskPriority, { name: 'ProjectTaskPriority' });

@ObjectType()
export class ProjectTask {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => String, { nullable: true })
  assigneeId?: string | null;

  @Field(() => ProjectTaskStatus)
  status: ProjectTaskStatus;

  @Field(() => ProjectTaskPriority)
  priority: ProjectTaskPriority;

  @Field(() => Date, { nullable: true })
  dueDate?: Date | null;

  @Field(() => Date, { nullable: true })
  completedAt?: Date | null;

  @Field()
  createdById: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  assignee?: User | null;

  @Field(() => User, { nullable: true })
  createdBy?: User;
}
