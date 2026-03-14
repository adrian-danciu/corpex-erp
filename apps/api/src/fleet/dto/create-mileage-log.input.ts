import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateMileageLogInput {
  @Field()
  vehicleId: string;

  @Field(() => Date)
  date: Date;

  @Field(() => Int)
  odometer: number;

  @Field({ nullable: true })
  notes?: string;
}
