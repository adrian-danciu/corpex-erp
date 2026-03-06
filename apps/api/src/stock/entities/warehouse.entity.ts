import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Warehouse {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field(() => String, { nullable: true })
  address?: string | null;

  @Field(() => String, { nullable: true })
  city?: string | null;

  @Field()
  country: string;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
