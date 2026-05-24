import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Department, ProjectMemberRole, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PROJECT_ACCESS_KEY } from '../decorators/project-access.decorator';
import { ProjectAccessGuard } from './project-access.guard';

describe('ProjectAccessGuard', () => {
  const teamMemberRole = 'TEAM_MEMBER' as ProjectMemberRole;
  const projectManagerRole = 'PROJECT_MANAGER' as ProjectMemberRole;

  let reflector: { get: jest.Mock };
  let prisma: {
    projectMember: { findFirst: jest.Mock; findUnique: jest.Mock };
    projectTask: { findUnique: jest.Mock };
    projectTaskComment: { findUnique: jest.Mock };
    projectMaterial: { findUnique: jest.Mock };
    projectService: { findUnique: jest.Mock };
    projectVehicle: { findUnique: jest.Mock };
    projectFeedEntry: { findUnique: jest.Mock };
  };
  let guard: ProjectAccessGuard;

  const executionContext = {
    getHandler: jest.fn(() => 'handler'),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { get: jest.fn() };
    prisma = {
      projectMember: { findFirst: jest.fn(), findUnique: jest.fn() },
      projectTask: { findUnique: jest.fn() },
      projectTaskComment: { findUnique: jest.fn() },
      projectMaterial: { findUnique: jest.fn() },
      projectService: { findUnique: jest.fn() },
      projectVehicle: { findUnique: jest.fn() },
      projectFeedEntry: { findUnique: jest.fn() },
    };
    guard = new ProjectAccessGuard(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockGqlContext(
    args: Record<string, unknown>,
    user: { id: string; role: Role; department: Department | null } | null,
  ) {
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
      getContext: () => ({ req: { user } }),
      getArgs: () => args,
    } as unknown as GqlExecutionContext);
  }

  it('allows access when no project metadata is required', async () => {
    reflector.get.mockReturnValue(undefined);

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);

    expect(reflector.get).toHaveBeenCalledWith(PROJECT_ACCESS_KEY, 'handler');
    expect(prisma.projectMember.findFirst).not.toHaveBeenCalled();
  });

  it('allows admins without resolving project membership', async () => {
    reflector.get.mockReturnValue('manager');
    mockGqlContext(
      { projectId: 'project-1' },
      { id: 'admin-1', role: Role.ADMIN, department: null },
    );

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);

    expect(prisma.projectMember.findFirst).not.toHaveBeenCalled();
  });

  it('allows management department users without resolving project membership', async () => {
    reflector.get.mockReturnValue('manager');
    mockGqlContext(
      { projectId: 'project-1' },
      { id: 'manager-1', role: Role.USER, department: Department.MANAGEMENT },
    );

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);

    expect(prisma.projectMember.findFirst).not.toHaveBeenCalled();
  });

  it('allows project members for member-level actions', async () => {
    reflector.get.mockReturnValue('member');
    mockGqlContext(
      { projectId: 'project-1' },
      { id: 'user-1', role: Role.USER, department: Department.IT },
    );
    prisma.projectMember.findFirst.mockResolvedValue({
      id: 'member-1',
      projectId: 'project-1',
      userId: 'user-1',
      role: teamMemberRole,
      leftAt: null,
    });

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);

    expect(prisma.projectMember.findFirst).toHaveBeenCalledWith({
      where: { projectId: 'project-1', userId: 'user-1', leftAt: null },
    });
  });

  it('rejects regular project members for manager-level actions', async () => {
    reflector.get.mockReturnValue('manager');
    mockGqlContext(
      { input: { projectId: 'project-1' } },
      { id: 'user-1', role: Role.USER, department: Department.IT },
    );
    prisma.projectMember.findFirst.mockResolvedValue({
      id: 'member-1',
      projectId: 'project-1',
      userId: 'user-1',
      role: teamMemberRole,
      leftAt: null,
    });

    await expect(guard.canActivate(executionContext)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('resolves project context from task id for project managers', async () => {
    reflector.get.mockReturnValue('manager');
    mockGqlContext(
      { taskId: 'task-1' },
      { id: 'user-1', role: Role.USER, department: Department.IT },
    );
    prisma.projectTask.findUnique.mockResolvedValue({
      projectId: 'project-1',
    });
    prisma.projectMember.findFirst.mockResolvedValue({
      id: 'member-1',
      projectId: 'project-1',
      userId: 'user-1',
      role: projectManagerRole,
      leftAt: null,
    });

    await expect(guard.canActivate(executionContext)).resolves.toBe(true);

    expect(prisma.projectTask.findUnique).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      select: { projectId: true },
    });
    expect(prisma.projectMember.findFirst).toHaveBeenCalledWith({
      where: { projectId: 'project-1', userId: 'user-1', leftAt: null },
    });
  });
});
