import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { ContractType } from '@prisma/client';

@InputType()
export class CreateEmployeeInput {
  @Field()
  userId: string;

  @Field()
  personalId: string; // CNP

  @Field()
  dateOfBirth: Date;

  @Field()
  phoneNumber: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field({ defaultValue: 'Romania' })
  country: string;

  @Field()
  position: string;

  @Field()
  department: string;

  @Field(() => ContractType)
  contractType: ContractType;

  @Field()
  employmentDate: Date;

  @Field({ nullable: true })
  contractEndDate?: Date;

  @Field(() => Float, { nullable: true })
  salary?: number;

  @Field(() => Int, { defaultValue: 21 })
  annualLeaveDays: number;

  @Field({ nullable: true })
  managerId?: string;
}
