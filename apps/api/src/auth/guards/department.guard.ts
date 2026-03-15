import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role, Department } from '@prisma/client';
import { DEPARTMENT_PERMISSIONS, AccessLevel } from '../permissions.config';

interface RequestUser {
  id: string;
  role: Role;
  department: Department | null;
}

interface RequiredModule {
  module: string;
  access: 'read' | 'write' | 'approve';
}

@Injectable()
export class DepartmentGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<RequiredModule>(
      'requiredModule',
      context.getHandler(),
    );

    if (!required) return true;

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext<{ req: { user: RequestUser } }>().req.user;

    if (!user) throw new ForbiddenException('Not authenticated');
    if (user.role === Role.ADMIN) return true;

    if (!user.department) throw new ForbiddenException('No department assigned');

    const perms = DEPARTMENT_PERMISSIONS[user.department];
    if (!perms) throw new ForbiddenException('Unknown department');

    const { module, access } = required;

    if (module === 'leaveApprovals') {
      if (!perms.leaveApprovals) {
        throw new ForbiddenException('Leave approval access not allowed for your department');
      }
      return true;
    }

    if (module === 'dashboard') {
      return perms.dashboard;
    }

    const moduleAccess = perms[module as keyof typeof perms] as AccessLevel | undefined;
    if (!moduleAccess || moduleAccess === 'none') {
      throw new ForbiddenException(
        `Access to ${module} not allowed for your department`,
      );
    }

    if (access === 'write' && moduleAccess === 'read') {
      throw new ForbiddenException(
        `Write access to ${module} not allowed for your department`,
      );
    }

    return true;
  }
}
