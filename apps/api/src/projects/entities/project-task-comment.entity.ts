import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class ProjectTaskComment {
  @Field(() => ID)
  id: string;

  @Field()
  taskId: string;

  @Field()
  authorId: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  author?: User | null;
}
