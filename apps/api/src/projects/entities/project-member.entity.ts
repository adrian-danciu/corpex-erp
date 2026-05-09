import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ProjectMemberRole } from '@prisma/client';
import { User } from '../../users/entities/user.entity';

registerEnumType(ProjectMemberRole, { name: 'ProjectMemberRole' });

@ObjectType()
export class ProjectMember {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  userId: string;

  @Field(() => ProjectMemberRole)
  role: ProjectMemberRole;

  @Field()
  joinedAt: Date;

  @Field(() => Date, { nullable: true })
  leftAt?: Date | null;

  @Field(() => User, { nullable: true })
  user?: User;
}
