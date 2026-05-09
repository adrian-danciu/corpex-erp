import { Field, InputType } from '@nestjs/graphql';
import { ProjectMemberRole } from '@prisma/client';

@InputType()
export class AddProjectMemberInput {
  @Field()
  projectId: string;

  @Field()
  userId: string;

  @Field(() => ProjectMemberRole, { defaultValue: ProjectMemberRole.MEMBER })
  role: ProjectMemberRole;
}

@InputType()
export class UpdateProjectMemberRoleInput {
  @Field()
  projectId: string;

  @Field()
  memberId: string;

  @Field(() => ProjectMemberRole)
  role: ProjectMemberRole;
}

@InputType()
export class RemoveProjectMemberInput {
  @Field()
  projectId: string;

  @Field()
  memberId: string;
}
