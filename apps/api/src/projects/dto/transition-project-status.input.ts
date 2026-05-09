import { Field, InputType } from '@nestjs/graphql';
import { ProjectStatus } from '@prisma/client';

@InputType()
export class TransitionProjectStatusInput {
  @Field()
  projectId: string;

  @Field(() => ProjectStatus)
  status: ProjectStatus;
}
