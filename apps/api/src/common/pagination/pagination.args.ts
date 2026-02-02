import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, {
    nullable: true,
    defaultValue: 0,
    description: 'Number of items to skip',
  })
  skip?: number = 0;

  @Field(() => Int, {
    nullable: true,
    defaultValue: 25,
    description: 'Number of items to take',
  })
  take?: number = 25;
}
