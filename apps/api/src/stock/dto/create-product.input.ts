import { Field, Float, InputType } from '@nestjs/graphql';

@InputType()
export class CreateProductInput {
  @Field()
  sku: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true, defaultValue: 'pcs' })
  unit?: string;

  @Field({ nullable: true })
  category?: string;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  minimumStock?: number;
}
