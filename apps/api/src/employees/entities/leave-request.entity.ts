import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { LeaveType, LeaveStatus } from '@prisma/client';
import { User } from '../../users/entities/user.entity';

// Register enums for GraphQL
registerEnumType(LeaveType, {
  name: 'LeaveType',
  description: 'Type of leave request',
});

registerEnumType(LeaveStatus, {
  name: 'LeaveStatus',
  description: 'Status of leave request',
});

@ObjectType()
export class LeaveRequest {
  @Field(() => ID)
  id: string;

  @Field()
  employeeId: string;

  @Field(() => User)
  employee: User;

  @Field(() => LeaveType)
  leaveType: LeaveType;

  @Field(() => Date)
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Int)
  days: number;

  @Field(() => String, { nullable: true })
  reason?: string | null;

  @Field(() => LeaveStatus)
  status: LeaveStatus;

  @Field(() => String, { nullable: true })
  approverId?: string | null;

  @Field(() => User, { nullable: true })
  approver?: User | null;

  @Field(() => String, { nullable: true })
  comments?: string | null;

  @Field(() => Date, { nullable: true })
  approvedAt?: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
