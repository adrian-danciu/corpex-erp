import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Vehicle } from '../../fleet/entities/vehicle.entity';

@ObjectType()
export class ProjectVehicle {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  vehicleId: string;

  @Field()
  startDate: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdAt: Date;

  @Field(() => Vehicle, { nullable: true })
  vehicle?: Vehicle;
}
