import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ProjectCostRollup {
  @Field(() => Float)
  budget: number;

  @Field(() => Float)
  materialsCost: number;

  @Field(() => Float)
  vehicleCost: number;

  @Field(() => Float)
  totalActual: number;

  @Field(() => Float)
  remaining: number;

  @Field()
  currency: string;
}
