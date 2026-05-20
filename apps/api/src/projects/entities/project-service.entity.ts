import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { ProjectServiceStatus } from '@prisma/client';

registerEnumType(ProjectServiceStatus, { name: 'ProjectServiceStatus' });

@ObjectType()
export class ProjectService {
  @Field(() => ID)
  id: string;

  @Field()
  projectId: string;

  @Field()
  description: string;

  @Field(() => Float)
  quantity: number;

  @Field()
  unit: string;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  vatRate: number;

  @Field(() => ProjectServiceStatus)
  status: ProjectServiceStatus;

  @Field()
  billable: boolean;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
