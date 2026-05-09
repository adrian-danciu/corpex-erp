import { InputType, Field, Float } from '@nestjs/graphql';
import { ExpenseType } from '@prisma/client';

@InputType()
export class CreateVehicleExpenseInput {
  @Field()
  vehicleId: string;

  @Field(() => ExpenseType)
  type: ExpenseType;

  @Field(() => Float)
  amount: number;

  @Field(() => Date)
  date: Date;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  projectId?: string;
}
