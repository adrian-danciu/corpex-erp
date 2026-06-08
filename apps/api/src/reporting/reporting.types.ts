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

  @Field(() => Int)
  totalSupplierInvoices: number;

  @Field(() => Int)
  overdueSupplierInvoices: number;

  @Field(() => Float)
  totalPayableAmount: number;

  @Field(() => Float)
  totalSupplierPaidAmount: number;
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

@ObjectType()
export class EmployeeReportRow {
  @Field()
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  position: string;

  @Field()
  department: string;

  @Field()
  contractType: string;

  @Field(() => Date)
  employmentDate: Date;

  @Field(() => Int)
  remainingLeave: number;

  @Field(() => Int)
  annualLeaveDays: number;
}

@ObjectType()
export class StockReportRow {
  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field()
  sku: string;

  @Field()
  warehouseName: string;

  @Field(() => Float)
  quantity: number;
}

@ObjectType()
export class FleetReportRow {
  @Field()
  id: string;

  @Field()
  plateNumber: string;

  @Field()
  brand: string;

  @Field()
  model: string;

  @Field(() => Int)
  year: number;

  @Field()
  status: string;

  @Field(() => Date, { nullable: true })
  nearestDocumentExpiry?: Date | null;

  @Field(() => String, { nullable: true })
  nearestDocumentType?: string | null;
}
