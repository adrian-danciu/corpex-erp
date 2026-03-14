import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';

registerEnumType(DocumentType, { name: 'DocumentType' });

@ObjectType()
export class VehicleDocument {
  @Field(() => ID)
  id: string;

  @Field()
  vehicleId: string;

  @Field(() => DocumentType)
  type: DocumentType;

  @Field(() => Date)
  expiryDate: Date;

  @Field(() => Date, { nullable: true })
  issuedDate?: Date | null;

  @Field(() => String, { nullable: true })
  provider?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
