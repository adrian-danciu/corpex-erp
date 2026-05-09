import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireModule } from '../auth/decorators/roles.decorator';
import { DepartmentGuard } from '../auth/guards/department.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { RequireProjectAccess } from './decorators/project-access.decorator';
import { CreateProjectInput } from './dto/create-project.input';
import { ProjectsFilterInput } from './dto/projects-filter.input';
import { TransitionProjectStatusInput } from './dto/transition-project-status.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { Project } from './entities/project.entity';
import { ProjectCostRollup } from './entities/project-cost-rollup.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectsService } from './projects.service';

@Resolver(() => Project)
@UseGuards(JwtAuthGuard, DepartmentGuard, ProjectAccessGuard)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Query(() => [Project], { name: 'projects' })
  @RequireModule('projects', 'read')
  async findAll(
    @CurrentUser() user: User,
    @Args('filter', { nullable: true, type: () => ProjectsFilterInput })
    filter?: ProjectsFilterInput,
  ) {
    return this.projectsService.findAll(filter, user.id);
  }

  @Query(() => Project, { name: 'project' })
  @RequireProjectAccess('member')
  async findOne(@Args('projectId') projectId: string) {
    return this.projectsService.findOne(projectId);
  }

  @Query(() => ProjectCostRollup, { name: 'projectCostRollup' })
  @RequireProjectAccess('member')
  async costRollup(@Args('projectId') projectId: string) {
    return this.projectsService.getCostRollup(projectId);
  }

  @Mutation(() => Project)
  @RequireModule('projects', 'write')
  async createProject(
    @Args('input') input: CreateProjectInput,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.create(input, user.id);
  }

  @Mutation(() => Project)
  @RequireProjectAccess('manager')
  async updateProject(
    @Args('input') input: UpdateProjectInput,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.update(input, user.id);
  }

  @Mutation(() => Project)
  @RequireProjectAccess('manager')
  async transitionProjectStatus(
    @Args('input') input: TransitionProjectStatusInput,
    @CurrentUser() user: User,
  ) {
    return this.projectsService.transitionStatus(
      input.projectId,
      input.status,
      user.id,
    );
  }
}
