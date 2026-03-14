import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class CreateVehicleLeaseInput {
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

  @Field({ nullable: true })
  notes?: string;
}
