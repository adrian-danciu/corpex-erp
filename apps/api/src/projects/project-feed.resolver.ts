import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ProjectFeedKind, Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { RequireProjectAccess } from './decorators/project-access.decorator';
import {
  CreateFeedPostInput,
  DeleteFeedEntryInput,
} from './dto/create-feed-post.input';
import { ProjectFeedEntry } from './entities/project-feed-entry.entity';
import { ProjectAccessGuard } from './guards/project-access.guard';
import { ProjectFeedService } from './project-feed.service';

@Resolver(() => ProjectFeedEntry)
@UseGuards(JwtAuthGuard, ProjectAccessGuard)
export class ProjectFeedResolver {
  constructor(private readonly service: ProjectFeedService) {}

  @Query(() => [ProjectFeedEntry], { name: 'projectFeed' })
  @RequireProjectAccess('member')
  async list(
    @Args('projectId') projectId: string,
    @Args('kind', { type: () => ProjectFeedKind, nullable: true })
    kind?: ProjectFeedKind,
  ) {
    return this.service.listFeed(projectId, { kind });
  }

  @Mutation(() => ProjectFeedEntry)
  @RequireProjectAccess('member')
  async createProjectFeedPost(
    @Args('input') input: CreateFeedPostInput,
    @CurrentUser() user: User,
  ) {
    if (input.content.trim().length === 0) {
      throw new ForbiddenException('Post content cannot be empty');
    }
    return this.service.createPost({
      projectId: input.projectId,
      authorId: user.id,
      content: input.content,
      attachmentUrl: input.attachmentUrl,
      attachmentName: input.attachmentName,
    });
  }

  @Mutation(() => ProjectFeedEntry)
  @RequireProjectAccess('member')
  async deleteProjectFeedEntry(
    @Args('input') input: DeleteFeedEntryInput,
    @CurrentUser() user: User,
  ) {
    return this.service.deletePost(
      input.feedEntryId,
      user.id,
      user.role === Role.ADMIN,
    );
  }
}
