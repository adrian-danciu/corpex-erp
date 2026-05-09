import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Project } from './entities/project.entity';
import { User } from '../users/entities/user.entity';
import { RequireProjectAccess } from './decorators/project-access.decorator';
import {
  AssignProjectVehicleInput,
  EndProjectVehicleAssignmentInput,
} from './dto/project-vehicle.inputs';
import { ProjectVehicle } from './entities/project-vehicle.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectVehiclesService } from './project-vehicles.service';

@Resolver(() => ProjectVehicle)
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ProjectVehiclesResolver {
  constructor(private readonly service: ProjectVehiclesService) {}

  @Query(() => [ProjectVehicle], { name: 'projectVehicles' })
  @RequireProjectAccess('member')
  async list(@Args('projectId') projectId: string) {
    return this.service.listForProject(projectId);
  }

  @Query(() => Project, {
    name: 'currentProjectForVehicle',
    nullable: true,
    description:
      'Returns the project currently using this vehicle (open assignment), or null',
  })
  async currentProjectForVehicle(@Args('vehicleId') vehicleId: string) {
    return this.service.currentProjectForVehicle(vehicleId);
  }

  @Mutation(() => ProjectVehicle)
  @RequireProjectAccess('manager')
  async assignProjectVehicle(
    @Args('input') input: AssignProjectVehicleInput,
    @CurrentUser() user: User,
  ) {
    return this.service.assign(input, user.id);
  }

  @Mutation(() => ProjectVehicle)
  @RequireProjectAccess('manager')
  async endProjectVehicleAssignment(
    @Args('input') input: EndProjectVehicleAssignmentInput,
    @CurrentUser() user: User,
  ) {
    return this.service.endAssignment(input, user.id);
  }
}
