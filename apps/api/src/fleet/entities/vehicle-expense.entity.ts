import { ObjectType, Field, ID, Float, registerEnumType } from '@nestjs/graphql';
import { ExpenseType } from '@prisma/client';

registerEnumType(ExpenseType, { name: 'ExpenseType' });

@ObjectType()
export class VehicleExpense {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field(() => ExpenseType)
  type: ExpenseType;

  @Field(() => Float)
  amount: number;

  @Field(() => Date)
  date: Date;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
