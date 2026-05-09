import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateFeedPostInput {
  @Field()
  projectId: string;

  @Field()
  content: string;

  @Field(() => String, { nullable: true })
  attachmentUrl?: string;

  @Field(() => String, { nullable: true })
  attachmentName?: string;
}

@InputType()
export class DeleteFeedEntryInput {
  @Field()
  feedEntryId: string;
}
