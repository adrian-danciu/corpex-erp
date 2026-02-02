import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { PartnerType } from '@prisma/client';

registerEnumType(PartnerType, {
  name: 'PartnerType',
  description: 'Type of business partner',
});

@ObjectType()
export class Partner {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  cui: string;

  @Field(() => String, { nullable: true })
  regCom?: string | null;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field()
  country: string;

  @Field(() => String, { nullable: true })
  email?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => String, { nullable: true })
  contactPerson?: string | null;

  @Field(() => PartnerType)
  partnerType: PartnerType;

  @Field(() => String, { nullable: true })
  bankName?: string | null;

  @Field(() => String, { nullable: true })
  bankAccount?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
