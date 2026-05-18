import type {
  ProjectTask,
  ProjectTaskComment,
} from "@/types/project.types";

interface PermissionInput {
  task: ProjectTask;
  currentUserId: string | undefined;
  isProjectManager: boolean;
  isAdminOrManagement: boolean;
}

export interface TaskPermissions {
  canEditFields: boolean;
  canDelete: boolean;
  canTransition: boolean;
  canComment: boolean;
  canEditComment: (c: ProjectTaskComment) => boolean;
}

export function getTaskPermissions(input: PermissionInput): TaskPermissions {
  const {
    task,
    currentUserId,
    isProjectManager,
    isAdminOrManagement,
  } = input;

  const isAssignee = !!currentUserId && task.assigneeId === currentUserId;
  const canEditFields = isProjectManager || isAdminOrManagement;
  const canDelete = canEditFields;
  const canTransition = canEditFields || isAssignee;
  const canComment = true;

  return {
    canEditFields,
    canDelete,
    canTransition,
    canComment,
    canEditComment: (c) =>
      isAdminOrManagement || (!!currentUserId && c.authorId === currentUserId),
  };
}
