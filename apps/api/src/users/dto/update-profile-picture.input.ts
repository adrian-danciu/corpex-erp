import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateProfilePictureInput {
  @Field({ nullable: true })
  profilePicture?: string;
}
