import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma/client';

// Register the Role enum for GraphQL
registerEnumType(Role, {
  name: 'Role',
  description: 'User role in the system',
});

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  // Password is intentionally NOT exposed in GraphQL
  // password: string;

  @Field(() => String, { nullable: true })
  profilePicture?: string | null;

  @Field(() => Role)
  role: Role;

  @Field()
  mustChangePassword: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
