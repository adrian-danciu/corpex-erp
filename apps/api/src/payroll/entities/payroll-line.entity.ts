import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Employee } from '../../employees/entities/employee.entity';

@ObjectType()
export class PayrollLine {
  @Field(() => ID)
  id: string;

  @Field()
  periodId: string;

  @Field()
  employeeId: string;

  @Field(() => Employee, { nullable: true })
  employee?: Employee;

  @Field(() => Float)
  grossSalary: number;

  @Field(() => Float)
  bonus: number;

  @Field(() => Float)
  manualDeductions: number;

  @Field(() => Int)
  unpaidLeaveDays: number;

  @Field(() => Float)
  unpaidLeaveDeduction: number;

  @Field(() => Float)
  taxableGross: number;

  @Field(() => Float)
  casRate: number;

  @Field(() => Float)
  casAmount: number;

  @Field(() => Float)
  cassRate: number;

  @Field(() => Float)
  cassAmount: number;

  @Field(() => Float)
  incomeTaxRate: number;

  @Field(() => Float)
  incomeTaxAmount: number;

  @Field(() => Float)
  camRate: number;

  @Field(() => Float)
  camAmount: number;

  @Field(() => Float)
  employerTotalCost: number;

  @Field()
  taxRuleVersion: string;

  @Field(() => Float)
  netAmount: number;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
