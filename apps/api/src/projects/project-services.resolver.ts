import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { RequireProjectAccess } from './decorators/project-access.decorator';
import {
  CreateProjectServiceInput,
  DeleteProjectServiceInput,
  UpdateProjectServiceInput,
} from './dto/project-service.inputs';
import { ProjectService } from './entities/project-service.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectServicesService } from './project-services.service';

@Resolver(() => ProjectService)
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ProjectServicesResolver {
  constructor(private readonly service: ProjectServicesService) {}

  @Query(() => [ProjectService], { name: 'projectServices' })
  @RequireProjectAccess('member')
  async list(@Args('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Mutation(() => ProjectService)
  @RequireProjectAccess('manager')
  async createProjectService(
    @Args('input') input: CreateProjectServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.service.create(input, user.id);
  }

  @Mutation(() => ProjectService)
  @RequireProjectAccess('manager')
  async updateProjectService(
    @Args('input') input: UpdateProjectServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.service.update(input, user.id);
  }

  @Mutation(() => ProjectService)
  @RequireProjectAccess('manager')
  async deleteProjectService(
    @Args('input') input: DeleteProjectServiceInput,
    @CurrentUser() user: User,
  ) {
    return this.service.remove(input, user.id);
  }
}
