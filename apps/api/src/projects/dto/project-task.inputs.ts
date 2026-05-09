import { Field, InputType } from '@nestjs/graphql';
import { ProjectTaskPriority, ProjectTaskStatus } from '@prisma/client';

@InputType()
export class CreateProjectTaskInput {
  @Field()
  projectId: string;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  assigneeId?: string;

  @Field(() => ProjectTaskPriority, {
    defaultValue: ProjectTaskPriority.MEDIUM,
  })
  priority: ProjectTaskPriority;

  @Field(() => Date, { nullable: true })
  dueDate?: Date;
}

@InputType()
export class UpdateProjectTaskInput {
  @Field()
  taskId: string;

  @Field({ nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  assigneeId?: string | null;

  @Field(() => ProjectTaskPriority, { nullable: true })
  priority?: ProjectTaskPriority;

  @Field(() => Date, { nullable: true })
  dueDate?: Date | null;
}

@InputType()
export class TransitionProjectTaskInput {
  @Field()
  taskId: string;

  @Field(() => ProjectTaskStatus)
  status: ProjectTaskStatus;
}
