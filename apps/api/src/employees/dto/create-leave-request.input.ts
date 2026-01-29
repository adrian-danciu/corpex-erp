import { InputType, Field, Int } from '@nestjs/graphql';
import { LeaveType } from '@prisma/client';

@InputType()
export class CreateLeaveRequestInput {
  @Field(() => LeaveType)
  leaveType: LeaveType;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;

  @Field(() => Int)
  days: number;

  @Field({ nullable: true })
  reason?: string;
}
