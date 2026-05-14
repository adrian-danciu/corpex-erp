import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Department, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddProjectTaskCommentInput,
  DeleteProjectTaskCommentInput,
  UpdateProjectTaskCommentInput,
} from './dto/project-task-comment.inputs';

interface Actor {
  id: string;
  role: Role;
  department: Department | null;
}

const commentInclude = { author: true };

@Injectable()
export class ProjectTaskCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForTask(taskId: string) {
    return this.prisma.projectTaskComment.findMany({
      where: { taskId },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async add(input: AddProjectTaskCommentInput, actorId: string) {
    const content = input.content.trim();
    if (!content) {
      throw new ForbiddenException('Comment cannot be empty');
    }
    const task = await this.prisma.projectTask.findUnique({
      where: { id: input.taskId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    return this.prisma.projectTaskComment.create({
      data: { taskId: input.taskId, authorId: actorId, content },
      include: commentInclude,
    });
  }

  async update(input: UpdateProjectTaskCommentInput, actor: Actor) {
    const content = input.content.trim();
    if (!content) {
      throw new ForbiddenException('Comment cannot be empty');
    }
    const comment = await this.prisma.projectTaskComment.findUnique({
      where: { id: input.commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    if (!this.canMutate(actor, comment.authorId)) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.projectTaskComment.update({
      where: { id: comment.id },
      data: { content },
      include: commentInclude,
    });
  }

  async delete(input: DeleteProjectTaskCommentInput, actor: Actor) {
    const comment = await this.prisma.projectTaskComment.findUnique({
      where: { id: input.commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    if (!this.canMutate(actor, comment.authorId)) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.projectTaskComment.delete({
      where: { id: comment.id },
    });
    return comment;
  }

  private canMutate(actor: Actor, authorId: string): boolean {
    if (actor.role === Role.ADMIN) return true;
    if (actor.department === Department.MANAGEMENT) return true;
    return actor.id === authorId;
  }
}
