import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Department, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

interface RequestUser {
  id: string;
  role: Role;
  department: Department | null;
}
import { RequireProjectAccess } from './decorators/project-access.decorator';
import {
  CreateProjectTaskInput,
  TransitionProjectTaskInput,
  UpdateProjectTaskInput,
} from './dto/project-task.inputs';
import { ProjectTask } from './entities/project-task.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectTasksService } from './project-tasks.service';

@Resolver(() => ProjectTask)
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ProjectTasksResolver {
  constructor(private readonly service: ProjectTasksService) {}

  @Query(() => [ProjectTask], { name: 'projectTasks' })
  @RequireProjectAccess('member')
  async list(@Args('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Query(() => [ProjectTask], { name: 'myProjectTasks' })
  async myTasks(@CurrentUser() user: User) {
    return this.service.myTasks(user.id);
  }

  @Mutation(() => ProjectTask)
  @RequireProjectAccess('manager')
  async createProjectTask(
    @Args('input') input: CreateProjectTaskInput,
    @CurrentUser() user: User,
  ) {
    return this.service.create(input, user.id);
  }

  @Mutation(() => ProjectTask)
  @RequireProjectAccess('manager')
  async updateProjectTask(
    @Args('input') input: UpdateProjectTaskInput,
    @CurrentUser() user: User,
  ) {
    return this.service.update(input, user.id);
  }

  @Mutation(() => ProjectTask)
  @RequireProjectAccess('member')
  async transitionProjectTask(
    @Args('input') input: TransitionProjectTaskInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.transition(input, user);
  }
}
