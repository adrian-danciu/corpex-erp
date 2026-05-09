import { SetMetadata } from '@nestjs/common';

export type ProjectAccessLevel = 'member' | 'manager';

export const PROJECT_ACCESS_KEY = 'requiredProjectAccess';

export const RequireProjectAccess = (level: ProjectAccessLevel) =>
  SetMetadata(PROJECT_ACCESS_KEY, level);
