import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class LinkEmployeeUserInput {
  @Field()
  employeeId: string;

  @Field()
  userId: string;
}
