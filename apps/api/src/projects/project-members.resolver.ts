import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { RequireProjectAccess } from './decorators/project-access.decorator';
import {
  AddProjectMemberInput,
  RemoveProjectMemberInput,
  UpdateProjectMemberRoleInput,
} from './dto/add-project-member.input';
import { ProjectMember } from './entities/project-member.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectMembersService } from './project-members.service';

@Resolver(() => ProjectMember)
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ProjectMembersResolver {
  constructor(private readonly service: ProjectMembersService) {}

  @Query(() => [ProjectMember], { name: 'projectMembers' })
  @RequireProjectAccess('member')
  async list(@Args('projectId') projectId: string) {
    return this.service.listActive(projectId);
  }

  @Mutation(() => ProjectMember)
  @RequireProjectAccess('manager')
  async addProjectMember(
    @Args('input') input: AddProjectMemberInput,
    @CurrentUser() user: User,
  ) {
    return this.service.addMember(input, user.id);
  }

  @Mutation(() => ProjectMember)
  @RequireProjectAccess('manager')
  async updateProjectMemberRole(
    @Args('input') input: UpdateProjectMemberRoleInput,
    @CurrentUser() user: User,
  ) {
    return this.service.updateRole(input, user.id);
  }

  @Mutation(() => ProjectMember)
  @RequireProjectAccess('manager')
  async removeProjectMember(
    @Args('input') input: RemoveProjectMemberInput,
    @CurrentUser() user: User,
  ) {
    return this.service.removeMember(input, user.id);
  }
}
