import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class UpdateCompanySettingsInput {
  @Field({ nullable: true })
  companyName?: string;

  @Field({ nullable: true })
  cui?: string;

  @Field({ nullable: true })
  regCom?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  bankAccount?: string;

  @Field({ nullable: true })
  defaultInvoiceSeries?: string;

  @Field({ nullable: true })
  defaultCurrency?: string;

  @Field(() => Float, { nullable: true })
  defaultVatRate?: number;

  @Field(() => Int, { nullable: true })
  paymentTermsDays?: number;

  @Field(() => Int, { nullable: true })
  defaultAnnualLeaveDays?: number;

  @Field({ nullable: true })
  defaultCountry?: string;
}
