import { InputType, Field, Float, Int, PartialType } from '@nestjs/graphql';
import { CreateEmployeeInput } from './create-employee.input';

@InputType()
export class UpdateEmployeeInput extends PartialType(CreateEmployeeInput) {
  @Field()
  id: string;

  @Field({ nullable: true })
  phoneNumber?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  position?: string;

  @Field({ nullable: true })
  department?: string;

  @Field(() => Float, { nullable: true })
  salary?: number;

  @Field(() => Int, { nullable: true })
  annualLeaveDays?: number;

  @Field(() => Int, { nullable: true })
  remainingLeave?: number;

  @Field({ nullable: true })
  managerId?: string;
}
