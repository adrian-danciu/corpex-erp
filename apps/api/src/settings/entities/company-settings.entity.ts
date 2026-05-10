import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';

@ObjectType()
export class CompanySettings {
  @Field(() => ID)
  id: string;

  @Field()
  companyName: string;

  @Field()
  cui: string;

  @Field()
  regCom: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field()
  country: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  bankName: string;

  @Field()
  bankAccount: string;

  @Field()
  defaultInvoiceSeries: string;

  @Field()
  defaultCurrency: string;

  @Field(() => Float)
  defaultVatRate: number;

  @Field(() => Int)
  paymentTermsDays: number;

  @Field(() => Int)
  defaultAnnualLeaveDays: number;

  @Field()
  defaultCountry: string;

  @Field(() => Int)
  fleetExpiryThresholdItp: number;

  @Field(() => Int)
  fleetExpiryThresholdRca: number;

  @Field(() => Int)
  fleetExpiryThresholdCasco: number;

  @Field(() => Int)
  fleetExpiryThresholdRovinieta: number;

  @Field(() => Date)
  updatedAt: Date;
}
