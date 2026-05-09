import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class AssignProjectVehicleInput {
  @Field()
  projectId: string;

  @Field()
  vehicleId: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class EndProjectVehicleAssignmentInput {
  @Field()
  projectId: string;

  @Field()
  assignmentId: string;

  @Field({ nullable: true })
  endDate?: Date;
}
