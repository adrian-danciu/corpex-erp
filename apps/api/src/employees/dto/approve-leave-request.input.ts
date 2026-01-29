import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class ApproveLeaveRequestInput {
  @Field()
  leaveRequestId: string;

  @Field()
  approved: boolean; // true = approve, false = reject

  @Field({ nullable: true })
  comments?: string;
}
