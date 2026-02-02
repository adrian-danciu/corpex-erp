import { InputType, Field } from '@nestjs/graphql';
import { PartnerType } from '@prisma/client';

@InputType()
export class UpdatePartnerInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

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
  contactPerson?: string;

  @Field(() => PartnerType, { nullable: true })
  partnerType?: PartnerType;

  @Field({ nullable: true })
  bankName?: string;

  @Field({ nullable: true })
  bankAccount?: string;

  @Field({ nullable: true })
  notes?: string;
}
