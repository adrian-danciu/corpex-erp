import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { ProjectStatus } from '@prisma/client';
import { Partner } from '../../finance/entities/partner.entity';
import { User } from '../../users/entities/user.entity';
import { ProjectMember } from './project-member.entity';
import { ProjectMaterial } from './project-material.entity';
import { ProjectVehicle } from './project-vehicle.entity';
import { ProjectTask } from './project-task.entity';
import { ProjectFeedEntry } from './project-feed-entry.entity';

registerEnumType(ProjectStatus, { name: 'ProjectStatus' });

@ObjectType()
export class Project {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  partnerId: string;

  @Field(() => Partner, { nullable: true })
  partner?: Partner;

  @Field(() => ProjectStatus)
  status: ProjectStatus;

  @Field(() => Float)
  budget: number;

  @Field()
  currency: string;

  @Field(() => Date, { nullable: true })
  plannedStartDate?: Date | null;

  @Field(() => Date, { nullable: true })
  plannedEndDate?: Date | null;

  @Field(() => Date, { nullable: true })
  actualStartDate?: Date | null;

  @Field(() => Date, { nullable: true })
  actualEndDate?: Date | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  createdById: string;

  @Field(() => User, { nullable: true })
  createdBy?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ProjectMember], { nullable: true })
  members?: ProjectMember[];

  @Field(() => [ProjectMaterial], { nullable: true })
  materials?: ProjectMaterial[];

  @Field(() => [ProjectVehicle], { nullable: true })
  vehicles?: ProjectVehicle[];

  @Field(() => [ProjectTask], { nullable: true })
  tasks?: ProjectTask[];

  @Field(() => [ProjectFeedEntry], { nullable: true })
  feed?: ProjectFeedEntry[];
}
