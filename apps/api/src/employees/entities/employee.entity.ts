import {
  ObjectType,
  Field,
  ID,
  Float,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { ContractType } from '@prisma/client';
import { User } from '../../users/entities/user.entity';

// Register the ContractType enum for GraphQL
registerEnumType(ContractType, {
  name: 'ContractType',
  description: 'Type of employment contract',
});

@ObjectType()
export class Employee {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => User)
  user: User;

  @Field()
  personalId: string; // CNP

  @Field(() => Date)
  dateOfBirth: Date;

  @Field()
  phoneNumber: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field()
  country: string;

  @Field()
  position: string;

  @Field()
  department: string;

  @Field(() => ContractType)
  contractType: ContractType;

  @Field(() => Date)
  employmentDate: Date;

  @Field(() => Date, { nullable: true })
  contractEndDate?: Date | null;

  @Field(() => Float, { nullable: true })
  salary?: number | null;

  @Field(() => Int)
  annualLeaveDays: number;

  @Field(() => Int)
  remainingLeave: number;

  @Field(() => String, { nullable: true })
  managerId?: string | null;

  @Field(() => Employee, { nullable: true })
  manager?: Employee | null;

  @Field(() => [Employee], { nullable: true })
  subordinates?: Employee[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
