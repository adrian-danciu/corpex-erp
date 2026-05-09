import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateProjectInput {
  @Field()
  projectId: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Float, { nullable: true })
  budget?: number;

  @Field({ nullable: true })
  currency?: string;

  @Field(() => Date, { nullable: true })
  plannedStartDate?: Date;

  @Field(() => Date, { nullable: true })
  plannedEndDate?: Date;

  @Field(() => String, { nullable: true })
  notes?: string;
}
