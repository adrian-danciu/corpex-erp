import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class AllocateProjectMaterialInput {
  @Field()
  projectId: string;

  @Field()
  productId: string;

  @Field()
  warehouseId: string;

  @Field(() => Float)
  quantity: number;

  @Field(() => Float, { nullable: true })
  unitCost?: number;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class RemoveProjectMaterialInput {
  @Field()
  projectId: string;

  @Field()
  projectMaterialId: string;
}
