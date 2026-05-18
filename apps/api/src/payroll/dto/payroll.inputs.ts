import { Field, Float, InputType, Int } from '@nestjs/graphql';

@InputType()
export class GeneratePayrollInput {
  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => String, { nullable: true })
  currency?: string;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class UpdatePayrollLineInput {
  @Field()
  lineId: string;

  @Field(() => Float, { nullable: true })
  bonus?: number;

  @Field(() => Float, { nullable: true })
  manualDeductions?: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}
