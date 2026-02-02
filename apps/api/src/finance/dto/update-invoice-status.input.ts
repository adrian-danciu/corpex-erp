import { InputType, Field } from '@nestjs/graphql';
import { InvoiceStatus } from '@prisma/client';

@InputType()
export class UpdateInvoiceStatusInput {
  @Field()
  id: string;

  @Field(() => InvoiceStatus)
  status: InvoiceStatus;
}
