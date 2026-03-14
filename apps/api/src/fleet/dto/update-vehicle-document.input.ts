import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateVehicleDocumentInput {
  @Field()
  id: string;

  @Field(() => Date, { nullable: true })
  expiryDate?: Date;

  @Field(() => Date, { nullable: true })
  issuedDate?: Date;

  @Field({ nullable: true })
  provider?: string;
}
