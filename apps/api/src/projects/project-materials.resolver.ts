import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { RequireProjectAccess } from './decorators/project-access.decorator';
import {
  AllocateProjectMaterialInput,
  RemoveProjectMaterialInput,
} from './dto/project-material.inputs';
import { ProjectMaterial } from './entities/project-material.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectMaterialsService } from './project-materials.service';

@Resolver(() => ProjectMaterial)
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ProjectMaterialsResolver {
  constructor(private readonly service: ProjectMaterialsService) {}

  @Query(() => [ProjectMaterial], { name: 'projectMaterials' })
  @RequireProjectAccess('member')
  async list(@Args('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Mutation(() => ProjectMaterial)
  @RequireProjectAccess('manager')
  async allocateProjectMaterial(
    @Args('input') input: AllocateProjectMaterialInput,
    @CurrentUser() user: User,
  ) {
    return this.service.allocate(input, user.id);
  }

  @Mutation(() => ProjectMaterial)
  @RequireProjectAccess('manager')
  async removeProjectMaterial(
    @Args('input') input: RemoveProjectMaterialInput,
    @CurrentUser() user: User,
  ) {
    return this.service.remove(input, user.id);
  }
}
