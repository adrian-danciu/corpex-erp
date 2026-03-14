import { InputType, Field, Int } from '@nestjs/graphql';
import { FuelType, VehicleStatus } from '@prisma/client';

@InputType()
export class UpdateVehicleInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  plateNumber?: string;

  @Field({ nullable: true })
  chassisNumber?: string;

  @Field({ nullable: true })
  brand?: string;

  @Field({ nullable: true })
  model?: string;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field(() => FuelType, { nullable: true })
  fuelType?: FuelType;

  @Field(() => VehicleStatus, { nullable: true })
  status?: VehicleStatus;
}
