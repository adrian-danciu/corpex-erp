import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateProductInput {
  @Field()
  productId: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field({ nullable: true })
  unit?: string;

  @Field(() => String, { nullable: true })
  category?: string;

  @Field(() => Float, { nullable: true })
  minimumStock?: number;

  @Field(() => Float, { nullable: true })
  unitPrice?: number;

  @Field({ nullable: true })
  isActive?: boolean;
}
