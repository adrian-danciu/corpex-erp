import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { PayrollStatus } from '@prisma/client';
import { User } from '../../users/entities/user.entity';
import { PayrollLine } from './payroll-line.entity';

registerEnumType(PayrollStatus, {
  name: 'PayrollStatus',
  description: 'Payroll period lifecycle status',
});

@ObjectType()
export class PayrollPeriod {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  year: number;

  @Field(() => Int)
  month: number;

  @Field(() => PayrollStatus)
  status: PayrollStatus;

  @Field()
  currency: string;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdById: string;

  @Field(() => User, { nullable: true })
  createdBy?: User;

  @Field(() => String, { nullable: true })
  approvedById?: string | null;

  @Field(() => User, { nullable: true })
  approvedBy?: User | null;

  @Field(() => Date, { nullable: true })
  approvedAt?: Date | null;

  @Field(() => String, { nullable: true })
  paidById?: string | null;

  @Field(() => User, { nullable: true })
  paidBy?: User | null;

  @Field(() => Date, { nullable: true })
  paidAt?: Date | null;

  @Field(() => [PayrollLine], { nullable: true })
  lines?: PayrollLine[];

  @Field(() => Float)
  totalGross: number;

  @Field(() => Float)
  totalBonus: number;

  @Field(() => Float)
  totalCas: number;

  @Field(() => Float)
  totalCass: number;

  @Field(() => Float)
  totalIncomeTax: number;

  @Field(() => Float)
  totalManualDeductions: number;

  @Field(() => Float)
  totalNet: number;

  @Field(() => Float)
  totalEmployerCost: number;

  @Field(() => Int)
  employeeCount: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
