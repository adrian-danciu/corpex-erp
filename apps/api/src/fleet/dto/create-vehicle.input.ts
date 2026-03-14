import { InputType, Field, Int } from '@nestjs/graphql';
import { FuelType } from '@prisma/client';

@InputType()
export class CreateVehicleInput {
  @Field()
  plateNumber: string;

  @Field()
  chassisNumber: string;

  @Field()
  brand: string;

  @Field()
  model: string;

  @Field(() => Int)
  year: number;

  @Field(() => FuelType)
  fuelType: FuelType;
}
