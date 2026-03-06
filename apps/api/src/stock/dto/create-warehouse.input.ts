import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateWarehouseInput {
  @Field()
  name: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true, defaultValue: 'Romania' })
  country?: string;
}
