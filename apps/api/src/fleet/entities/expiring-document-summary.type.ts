import { ObjectType, Field, Int } from '@nestjs/graphql';
import { DocumentType } from '@prisma/client';

@ObjectType()
export class ExpiringDocumentSummary {
  @Field(() => DocumentType)
  type: DocumentType;

  @Field(() => Int)
  count: number;
}
