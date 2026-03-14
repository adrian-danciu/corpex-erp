import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { FuelType, VehicleStatus } from '@prisma/client';
import { VehicleDocument } from './vehicle-document.entity';
import { MileageLog } from './mileage-log.entity';
import { VehicleLease } from './vehicle-lease.entity';
import { VehicleExpense } from './vehicle-expense.entity';

registerEnumType(FuelType, { name: 'FuelType' });
registerEnumType(VehicleStatus, { name: 'VehicleStatus' });

@ObjectType()
export class Vehicle {
  @Field(() => ID)
  id: string;

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

  @Field(() => VehicleStatus)
  status: VehicleStatus;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [VehicleDocument], { nullable: true })
  documents?: VehicleDocument[];

  @Field(() => [MileageLog], { nullable: true })
  mileageLogs?: MileageLog[];

  @Field(() => [VehicleLease], { nullable: true })
  leases?: VehicleLease[];

  @Field(() => [VehicleExpense], { nullable: true })
  expenses?: VehicleExpense[];
}
