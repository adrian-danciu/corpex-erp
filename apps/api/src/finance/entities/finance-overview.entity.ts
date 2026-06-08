import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FinanceOverview {
  @Field(() => Float)
  totalReceivable: number;

  @Field(() => Float)
  totalPayable: number;

  @Field(() => Float)
  overdueAmount: number;

  @Field(() => Int)
  invoicesThisMonth: number;
}
