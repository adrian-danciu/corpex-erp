import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Department, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequireProjectAccess } from './decorators/project-access.decorator';
import {
  AddProjectTaskCommentInput,
  DeleteProjectTaskCommentInput,
  UpdateProjectTaskCommentInput,
} from './dto/project-task-comment.inputs';
import { ProjectTaskComment } from './entities/project-task-comment.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectTaskCommentsService } from './project-task-comments.service';

interface RequestUser {
  id: string;
  role: Role;
  department: Department | null;
}

@Resolver(() => ProjectTaskComment)
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ProjectTaskCommentsResolver {
  constructor(private readonly service: ProjectTaskCommentsService) {}

  @Query(() => [ProjectTaskComment], { name: 'projectTaskComments' })
  @RequireProjectAccess('member')
  async list(@Args('taskId') taskId: string) {
    return this.service.listForTask(taskId);
  }

  @Mutation(() => ProjectTaskComment)
  @RequireProjectAccess('member')
  async addProjectTaskComment(
    @Args('input') input: AddProjectTaskCommentInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.add(input, user.id);
  }

  @Mutation(() => ProjectTaskComment)
  @RequireProjectAccess('member')
  async updateProjectTaskComment(
    @Args('input') input: UpdateProjectTaskCommentInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(input, user);
  }

  @Mutation(() => ProjectTaskComment)
  @RequireProjectAccess('member')
  async deleteProjectTaskComment(
    @Args('input') input: DeleteProjectTaskCommentInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.delete(input, user);
  }
}
