import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ProjectFeedKind } from '@prisma/client';
import GraphQLJSON from 'graphql-type-json';
import { User } from '../../users/entities/user.entity';

registerEnumType(ProjectFeedKind, { name: 'ProjectFeedKind' });

@ObjectType()
export class ProjectFeedEntry {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field(() => ProjectFeedKind)
  kind: ProjectFeedKind;

  @Field(() => String, { nullable: true })
  authorId?: string | null;

  @Field()
  content: string;

  @Field(() => String, { nullable: true })
  attachmentUrl?: string | null;

  @Field(() => String, { nullable: true })
  attachmentName?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: unknown;

  @Field()
  createdAt: Date;

  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null;

  @Field(() => User, { nullable: true })
  author?: User | null;
}
