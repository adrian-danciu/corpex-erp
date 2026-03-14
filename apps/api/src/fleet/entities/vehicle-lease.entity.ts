import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class VehicleLease {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field()
  provider: string;

  @Field(() => Date)
  startDate: Date;

  @Field(() => Date)
  endDate: Date;

  @Field(() => Float)
  monthlyRate: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
