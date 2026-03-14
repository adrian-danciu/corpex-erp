import { InputType, Field, Float } from '@nestjs/graphql';

@InputType()
export class UpdateVehicleLeaseInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  provider?: string;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;

  @Field(() => Float, { nullable: true })
  monthlyRate?: number;

  @Field({ nullable: true })
  notes?: string;
}
