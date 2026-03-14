import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class MileageLog {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field(() => Date)
  date: Date;

  @Field(() => Int)
  odometer: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Date)
  createdAt: Date;
}
