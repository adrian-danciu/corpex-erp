import { useMemo, useState } from "react";
import {
  useApolloClient,
  useMutation,
  useQuery,
} from "@apollo/client/react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { useAuthStore } from "@/stores/auth.store";
import {
  GET_PROJECT_TASKS_QUERY,
  GET_PROJECT_TASK_ACTIVITY_QUERY,
  GET_PROJECT_TASK_COMMENTS_QUERY,
} from "@/graphql/mutations/project.queries";
import {
  ADD_PROJECT_TASK_COMMENT_MUTATION,
  DELETE_PROJECT_TASK_COMMENT_MUTATION,
  DELETE_PROJECT_TASK_MUTATION,
  TRANSITION_PROJECT_TASK_MUTATION,
  UPDATE_PROJECT_TASK_COMMENT_MUTATION,
  UPDATE_PROJECT_TASK_MUTATION,
} from "@/graphql/mutations/project.mutations";
import {
  ProjectTaskStatus,
  type AddProjectTaskCommentMutationResult,
  type Project,
  type ProjectTaskActivityQueryResult,
  type ProjectTaskCommentsQueryResult,
  type ProjectTasksQueryResult,
} from "@/types/project.types";
import { getTaskPermissions } from "@/lib/projectTaskPermissions";
import { InlineEditText } from "./inline-edit/InlineEditText";
import { TaskActivityPanel } from "./detail/TaskActivityPanel";
import { TaskCommentComposer } from "./detail/TaskCommentComposer";
import { TaskDeleteDialog } from "./detail/TaskDeleteDialog";
import { TaskFieldsPanel } from "./detail/TaskFieldsPanel";

interface Props {
  project: Project;
  taskId: string | null;
  isProjectManager: boolean;
  onClose: () => void;
}

export function TaskDetailSheet({
  project,
  taskId,
  isProjectManager,
  onClose,
}: Props) {
  const apollo = useApolloClient();
  const { user } = useAuthStore();
  const isAdminOrManagement =
    user?.role === "ADMIN" || user?.department === "MANAGEMENT";

  const open = !!taskId;

  const cachedTasks = apollo.readQuery<ProjectTasksQueryResult>({
    query: GET_PROJECT_TASKS_QUERY,
    variables: { projectId: project.id },
  });
  const task = useMemo(
    () => cachedTasks?.projectTasks.find((t) => t.id === taskId) ?? null,
    [cachedTasks, taskId],
  );

  const { data: commentsData } = useQuery<ProjectTaskCommentsQueryResult>(
    GET_PROJECT_TASK_COMMENTS_QUERY,
    {
    variables: { taskId: taskId ?? "" },
    skip: !taskId,
    fetchPolicy: "cache-and-network",
  });

  const { data: activityData } = useQuery<ProjectTaskActivityQueryResult>(
    GET_PROJECT_TASK_ACTIVITY_QUERY,
    {
    variables: { taskId: taskId ?? "" },
    skip: !taskId,
    fetchPolicy: "cache-and-network",
  });

  const [draftComment, setDraftComment] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [updateTask] = useMutation(UPDATE_PROJECT_TASK_MUTATION);
  const [transitionTask] = useMutation(TRANSITION_PROJECT_TASK_MUTATION);

  const [addComment] =
    useMutationWithToast<AddProjectTaskCommentMutationResult>(
      ADD_PROJECT_TASK_COMMENT_MUTATION,
      {
    successMessage: undefined,
  });
  const [updateComment] = useMutationWithToast(
    UPDATE_PROJECT_TASK_COMMENT_MUTATION,
    { successMessage: undefined },
  );
  const [deleteComment] = useMutationWithToast(
    DELETE_PROJECT_TASK_COMMENT_MUTATION,
    { successMessage: undefined },
  );
  const [deleteTask] = useMutationWithToast(DELETE_PROJECT_TASK_MUTATION, {
    successMessage: "Task deleted",
  });

  if (!task) {
    return (
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[640px] p-0 gap-0 flex flex-col"
        >
          <SheetHeader className="border-b border-slate-200 px-6 py-4">
            <SheetTitle className="text-base">Task</SheetTitle>
          </SheetHeader>
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
            Loading…
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const perms = getTaskPermissions({
    task,
    currentUserId: user?.id,
    isProjectManager,
    isAdminOrManagement,
  });

  const memberOptions = (project.members ?? [])
    .filter((m) => !m.leftAt && m.user)
    .map((m) => ({
      value: m.userId,
      label: `${m.user?.firstName ?? ""} ${m.user?.lastName ?? ""}`.trim(),
    }));

  const updateField = async (vars: { input: Record<string, unknown> }) => {
    await updateTask({ variables: vars });
  };

  const handleStatusChange = async (next: string) => {
    const nextStatus = next as ProjectTaskStatus;
    if (nextStatus === task.status) return;
    apollo.cache.modify({
      id: apollo.cache.identify({ __typename: "ProjectTask", id: task.id }),
      fields: { status: () => nextStatus },
    });
    try {
      await transitionTask({
        variables: { input: { taskId: task.id, status: nextStatus } },
      });
    } catch {
      apollo.cache.modify({
        id: apollo.cache.identify({ __typename: "ProjectTask", id: task.id }),
        fields: { status: () => task.status },
      });
    }
  };

  const handleAddComment = async () => {
    const content = draftComment.trim();
    if (!content || !taskId) return;
    setDraftComment("");
    try {
      await addComment({
        variables: { input: { taskId, content } },
        update: (cache, { data }) => {
          if (!data?.addProjectTaskComment) return;
          cache.updateQuery<ProjectTaskCommentsQueryResult>(
            {
              query: GET_PROJECT_TASK_COMMENTS_QUERY,
              variables: { taskId },
            },
            (existing) => ({
              projectTaskComments: [
                ...(existing?.projectTaskComments ?? []),
                data.addProjectTaskComment,
              ],
            }),
          );
        },
      });
    } catch {
      setDraftComment(content);
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    await updateComment({
      variables: { input: { commentId, content } },
    });
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment({
      variables: { input: { commentId } },
      update: (cache) => {
        if (!taskId) return;
        cache.updateQuery<ProjectTaskCommentsQueryResult>(
          {
            query: GET_PROJECT_TASK_COMMENTS_QUERY,
            variables: { taskId },
          },
          (existing) => ({
            projectTaskComments: (existing?.projectTaskComments ?? []).filter(
              (c) => c.id !== commentId,
            ),
          }),
        );
      },
    });
  };

  const handleDeleteTask = async () => {
    if (!taskId) return;
    try {
      await deleteTask({
        variables: { input: { taskId } },
        update: (cache) => {
          cache.updateQuery<ProjectTasksQueryResult>(
            {
              query: GET_PROJECT_TASKS_QUERY,
              variables: { projectId: project.id },
            },
            (existing) => ({
              projectTasks: (existing?.projectTasks ?? []).filter(
                (t) => t.id !== taskId,
              ),
            }),
          );
        },
      });
      setConfirmDeleteOpen(false);
      onClose();
    } catch {
      // toast already fired by useMutationWithToast
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[640px] p-0 gap-0 flex flex-col"
        >
          <SheetHeader className="border-b border-slate-200 px-6 py-4 gap-1.5">
            <div className="flex items-center justify-between gap-2 pr-8">
              <SheetDescription className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Task · {project.code ?? project.name}
              </SheetDescription>
              {perms.canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 -my-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmDeleteOpen(true)}
                  aria-label="Delete task"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <SheetTitle className="sr-only">{task.title}</SheetTitle>
            <InlineEditText
              value={task.title}
              placeholder="Untitled task"
              disabled={!perms.canEditFields}
              className="text-xl font-semibold leading-tight text-slate-900 -mx-2"
              inputClassName="text-xl font-semibold"
              onSave={(next) =>
                updateField({ input: { taskId: task.id, title: next } })
              }
            />
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            <TaskFieldsPanel
              handleStatusChange={handleStatusChange}
              memberOptions={memberOptions}
              perms={perms}
              task={task}
              updateField={updateField}
            />
            <TaskActivityPanel
              events={activityData?.projectTaskActivity ?? []}
              comments={commentsData?.projectTaskComments ?? []}
              perms={perms}
              onUpdateComment={handleUpdateComment}
              onDeleteComment={handleDeleteComment}
            />
          </div>

          <SheetFooter className="border-t border-slate-200 px-6 py-3 gap-2 mt-0">
            <TaskCommentComposer
              draftComment={draftComment}
              setDraftComment={setDraftComment}
              onSend={() => void handleAddComment()}
            />
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <TaskDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={() => void handleDeleteTask()}
        taskTitle={task.title}
      />
    </>
  );
}
