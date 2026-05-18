import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AddProjectTaskCommentInput {
  @Field()
  taskId: string;

  @Field()
  content: string;
}

@InputType()
export class UpdateProjectTaskCommentInput {
  @Field()
  commentId: string;

  @Field()
  content: string;
}

@InputType()
export class DeleteProjectTaskCommentInput {
  @Field()
  commentId: string;
}
