import { InputType, Field } from '@nestjs/graphql';
import { PartnerType } from '@prisma/client';

@InputType()
export class CreatePartnerInput {
  @Field()
  name: string;

  @Field()
  cui: string;

  @Field({ nullable: true })
  regCom?: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field({ defaultValue: 'Romania' })
  country: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  contactPerson?: string;

  @Field(() => PartnerType)
  partnerType: PartnerType;

  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  bankAccount?: string;

  @Field({ nullable: true })
  notes?: string;
}
