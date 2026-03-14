import { InputType, Field } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';

@InputType()
export class CreateVehicleDocumentInput {
  @Field()
  vehicleId: string;

  @Field(() => DocumentType)
  type: DocumentType;

  @Field(() => Date)
  expiryDate: Date;

  @Field(() => Date, { nullable: true })
  issuedDate?: Date;

  @Field({ nullable: true })
  provider?: string;
}
