import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

export const RequireModule = (
  module: string,
  access: 'read' | 'write' | 'approve',
) => SetMetadata('requiredModule', { module, access });
