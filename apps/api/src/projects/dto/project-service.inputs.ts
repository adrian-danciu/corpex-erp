import { Field, Float, InputType } from '@nestjs/graphql';
import { ProjectServiceStatus } from '@prisma/client';

@InputType()
export class CreateProjectServiceInput {
  @Field()
  projectId: string;

  @Field()
  description: string;

  @Field(() => Float)
  quantity: number;

  @Field({ defaultValue: 'service' })
  unit: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float, { defaultValue: 19 })
  vatRate: number;

  @Field(() => ProjectServiceStatus, { nullable: true })
  status?: ProjectServiceStatus;

  @Field(() => Boolean, { defaultValue: true })
  billable: boolean;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class UpdateProjectServiceInput {
  @Field()
  projectId: string;

  @Field()
  serviceId: string;

  @Field(() => ProjectServiceStatus, { nullable: true })
  status?: ProjectServiceStatus;

  @Field(() => Boolean, { nullable: true })
  billable?: boolean;
}

@InputType()
export class DeleteProjectServiceInput {
  @Field()
  projectId: string;

  @Field()
  serviceId: string;
}
