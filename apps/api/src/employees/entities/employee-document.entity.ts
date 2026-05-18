import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { EmployeeDocumentType } from '@prisma/client';
import { Employee } from './employee.entity';
import { User } from '../../users/entities/user.entity';

registerEnumType(EmployeeDocumentType, {
  name: 'EmployeeDocumentType',
  description: 'Type of document stored in an employee file',
});

@ObjectType()
export class EmployeeDocument {
  @Field(() => ID)
  id: string;

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

  @Field(() => Int)
  size: number;

  @Field(() => Date, { nullable: true })
  expiryDate?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  uploadedById: string;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field(() => User, { nullable: true })
  uploadedBy?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
