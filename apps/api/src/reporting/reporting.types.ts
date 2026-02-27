import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DashboardMetrics {
  @Field(() => Int)
  totalUsers: number;

  @Field(() => Int)
  totalEmployees: number;

  @Field(() => Int)
  pendingLeaveRequests: number;

  @Field(() => Int)
  approvedLeaveThisMonth: number;

  @Field(() => Int)
  totalInvoices: number;

  @Field(() => Int)
  overdueInvoices: number;

  @Field(() => Float)
  totalInvoicedAmount: number;

  @Field(() => Float)
  totalPaidAmount: number;
}

@ObjectType()
export class HrLeaveSummary {
  @Field()
  status: string;

  @Field(() => Int)
  count: number;
}

@ObjectType()
export class FinanceAgingBucket {
  @Field()
  label: string;

  @Field(() => Float)
  amount: number;

  @Field(() => Int)
  invoiceCount: number;
}
