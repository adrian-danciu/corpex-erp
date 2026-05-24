import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class EmployeeAccountGenerationResult {
  @Field()
  employeeId: string;

  @Field(() => String, { nullable: true })
  employeeName: string | null;

  @Field(() => String, { nullable: true })
  email: string | null;

  @Field(() => String, { nullable: true })
  initialPassword: string | null;

  @Field()
  created: boolean;

  @Field()
  message: string;
}
