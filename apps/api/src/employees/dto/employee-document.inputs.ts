import { Field, InputType } from '@nestjs/graphql';
import { EmployeeDocumentType } from '@prisma/client';

@InputType()
export class CreateEmployeeDocumentInput {
  @Field()
  employeeId: string;

  @Field(() => EmployeeDocumentType)
  type: EmployeeDocumentType;

  @Field()
  title: string;

  @Field()
  fileName: string;

  @Field()
  fileUrl: string;

  @Field()
  mimeType: string;

  @Field()
  size: number;

  @Field(() => Date, { nullable: true })
  expiryDate?: Date;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class EmployeeDocumentFilterInput {
  @Field(() => String, { nullable: true })
  employeeId?: string;

  @Field(() => EmployeeDocumentType, { nullable: true })
  type?: EmployeeDocumentType;
}
