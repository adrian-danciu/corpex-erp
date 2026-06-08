import { useCallback, useMemo, useState } from "react";
import {
  DragDropProvider,
  KeyboardSensor,
  PointerSensor,
} from "@dnd-kit/react";
import type { DragEndEvent } from "@dnd-kit/react";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { Spinner } from "@/components/ui/spinner";
import { useQuery, useApolloClient } from "@apollo/client/react";
import {
  ProjectTaskStatus,
  type Project,
  type ProjectTasksQueryResult,
  type ProjectTask,
} from "@/types/project.types";
import { GET_PROJECT_TASKS_QUERY } from "@/graphql/mutations/project.queries";
import { TRANSITION_PROJECT_TASK_MUTATION } from "@/graphql/mutations/project.mutations";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useAuthStore } from "@/stores/auth.store";
import { getTaskPermissions } from "@/lib/projectTaskPermissions";
import { TaskColumn } from "./TaskColumn";
import { TaskDetailSheet } from "./TaskDetailSheet";

const COLUMNS: {
  status: ProjectTaskStatus;
  label: string;
  className: string;
}[] = [
  { status: ProjectTaskStatus.TODO, label: "To do", className: "bg-slate-50" },
  {
    status: ProjectTaskStatus.IN_PROGRESS,
    label: "In progress",
    className: "bg-blue-50",
  },
  {
    status: ProjectTaskStatus.IN_REVIEW,
    label: "In review",
    className: "bg-purple-50",
  },
  { status: ProjectTaskStatus.DONE, label: "Done", className: "bg-green-50" },
  {
    status: ProjectTaskStatus.BLOCKED,
    label: "Blocked",
    className: "bg-red-50",
  },
];

const SENSORS = [
  PointerSensor.configure({
    activationConstraints: [
      new PointerActivationConstraints.Distance({ value: 5 }),
    ],
  }),
  KeyboardSensor,
];

interface Props {
  project: Project;
  isProjectManager: boolean;
}

interface TaskDragData {
  taskId?: string;
  status?: ProjectTaskStatus;
}

interface ColumnDropData {
  status?: ProjectTaskStatus;
}

export function TaskBoard({ project, isProjectManager }: Props) {
  const { user } = useAuthStore();
  const isAdminOrManagement =
    user?.role === "ADMIN" || user?.department === "MANAGEMENT";

  const variables = { projectId: project.id };
  const { data, loading } = useQuery<ProjectTasksQueryResult>(
    GET_PROJECT_TASKS_QUERY,
    { variables, fetchPolicy: "cache-first" },
  );

  const apollo = useApolloClient();
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [pendingTaskIds, setPendingTaskIds] = useState<Set<string>>(
    () => new Set(),
  );

  const markPending = useCallback((taskId: string, pending: boolean) => {
    setPendingTaskIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }, []);

  const [transitionTask] = useMutationWithToast(
    TRANSITION_PROJECT_TASK_MUTATION,
    { successMessage: undefined },
  );

  const tasks = useMemo(() => data?.projectTasks ?? [], [data?.projectTasks]);

  const tasksByStatus = useMemo(() => {
    return COLUMNS.reduce(
      (acc, col) => {
        acc[col.status] = tasks.filter((t) => t.status === col.status);
        return acc;
      },
      {} as Record<ProjectTaskStatus, ProjectTask[]>,
    );
  }, [tasks]);

  const draggableTaskIds = useMemo(() => {
    const ids = new Set<string>();
    for (const task of tasks) {
      const perms = getTaskPermissions({
        task,
        currentUserId: user?.id,
        isProjectManager,
        isAdminOrManagement,
      });
      if (perms.canTransition) ids.add(task.id);
    }
    return ids;
  }, [tasks, user?.id, isProjectManager, isAdminOrManagement]);

  const writeStatusToCache = (
    taskId: string,
    nextStatus: ProjectTaskStatus,
  ) => {
    apollo.cache.modify({
      id: apollo.cache.identify({ __typename: "ProjectTask", id: taskId }),
      fields: { status: () => nextStatus },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;
    const source = event.operation.source;
    const target = event.operation.target;
    if (!source || !target) return;

    const sourceData = source.data as TaskDragData | undefined;
    const targetData = target.data as ColumnDropData | undefined;

    const taskId = sourceData?.taskId;
    const fromStatus = sourceData?.status;
    const toStatus = targetData?.status;
    if (!taskId || !toStatus || !fromStatus || fromStatus === toStatus) return;

    writeStatusToCache(taskId, toStatus);
    markPending(taskId, true);

    transitionTask({
      variables: { input: { taskId, status: toStatus } },
      optimisticResponse: {
        transitionProjectTask: {
          __typename: "ProjectTask",
          id: taskId,
          status: toStatus,
          completedAt:
            toStatus === ProjectTaskStatus.DONE
              ? new Date().toISOString()
              : null,
        },
      },
    })
      .catch(() => {
        writeStatusToCache(taskId, fromStatus);
      })
      .finally(() => {
        markPending(taskId, false);
      });
  };

  const isInitialLoading = loading && !data;

  return (
    <>
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center gap-2 min-h-[300px] text-slate-500">
          <Spinner className="size-6" />
          <span className="text-sm">Loading tasks…</span>
        </div>
      ) : (
        <DragDropProvider onDragEnd={handleDragEnd} sensors={SENSORS}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {COLUMNS.map((col) => (
              <TaskColumn
                key={col.status}
                status={col.status}
                label={col.label}
                className={col.className}
                tasks={tasksByStatus[col.status]}
                onOpenTask={setOpenTaskId}
                draggableTaskIds={draggableTaskIds}
                pendingTaskIds={pendingTaskIds}
              />
            ))}
          </div>
        </DragDropProvider>
      )}

      <TaskDetailSheet
        project={project}
        taskId={openTaskId}
        isProjectManager={isProjectManager}
        onClose={() => setOpenTaskId(null)}
      />
    </>
  );
}
