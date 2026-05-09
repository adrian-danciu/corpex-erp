import { Field, InputType } from '@nestjs/graphql';
import { ProjectStatus } from '@prisma/client';

@InputType()
export class ProjectsFilterInput {
  @Field(() => ProjectStatus, { nullable: true })
  status?: ProjectStatus;

  @Field(() => String, { nullable: true })
  partnerId?: string;

  @Field(() => Boolean, { nullable: true })
  onlyMine?: boolean;

  @Field(() => String, { nullable: true })
  search?: string;
}
