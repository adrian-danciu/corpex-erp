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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ProjectTaskPriority,
  ProjectTaskStatus,
  type Project,
  type ProjectFeedEntry,
  type ProjectTask,
  type ProjectTaskComment,
} from "@/types/project.types";
import { getTaskPermissions } from "@/lib/projectTaskPermissions";
import { InlineEditText } from "./inline-edit/InlineEditText";
import { InlineEditTextarea } from "./inline-edit/InlineEditTextarea";
import { InlineEditSelect } from "./inline-edit/InlineEditSelect";
import { TaskActivityTimeline } from "./TaskActivityTimeline";

interface Props {
  project: Project;
  taskId: string | null;
  isProjectManager: boolean;
  onClose: () => void;
}

// Radix Select disallows empty-string Item values, so we use a non-empty sentinel
// for the "Unassigned" option and translate at the boundaries.
const UNASSIGNED_VALUE = "__unassigned__";

const STATUS_OPTIONS = [
  { value: ProjectTaskStatus.TODO, label: "To do" },
  { value: ProjectTaskStatus.IN_PROGRESS, label: "In progress" },
  { value: ProjectTaskStatus.IN_REVIEW, label: "In review" },
  { value: ProjectTaskStatus.DONE, label: "Done" },
  { value: ProjectTaskStatus.BLOCKED, label: "Blocked" },
];

const PRIORITY_OPTIONS = [
  { value: ProjectTaskPriority.LOW, label: "Low" },
  { value: ProjectTaskPriority.MEDIUM, label: "Medium" },
  { value: ProjectTaskPriority.HIGH, label: "High" },
];

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

  const cachedTasks = apollo.readQuery<{ projectTasks: ProjectTask[] }>({
    query: GET_PROJECT_TASKS_QUERY,
    variables: { projectId: project.id },
  });
  const task = useMemo(
    () => cachedTasks?.projectTasks.find((t) => t.id === taskId) ?? null,
    [cachedTasks, taskId],
  );

  const { data: commentsData } = useQuery<{
    projectTaskComments: ProjectTaskComment[];
  }>(GET_PROJECT_TASK_COMMENTS_QUERY, {
    variables: { taskId: taskId ?? "" },
    skip: !taskId,
    fetchPolicy: "cache-and-network",
  });

  const { data: activityData } = useQuery<{
    projectTaskActivity: ProjectFeedEntry[];
  }>(GET_PROJECT_TASK_ACTIVITY_QUERY, {
    variables: { taskId: taskId ?? "" },
    skip: !taskId,
    fetchPolicy: "cache-and-network",
  });

  const [draftComment, setDraftComment] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [updateTask] = useMutation(UPDATE_PROJECT_TASK_MUTATION);
  const [transitionTask] = useMutation(TRANSITION_PROJECT_TASK_MUTATION);

  const [addComment] = useMutationWithToast<{
    addProjectTaskComment: ProjectTaskComment;
  }>(ADD_PROJECT_TASK_COMMENT_MUTATION, {
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
          cache.updateQuery<{ projectTaskComments: ProjectTaskComment[] }>(
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
        cache.updateQuery<{ projectTaskComments: ProjectTaskComment[] }>(
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
          cache.updateQuery<{ projectTasks: ProjectTask[] }>(
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <InlineEditSelect
                  value={task.status}
                  options={STATUS_OPTIONS}
                  disabled={!perms.canTransition}
                  onSave={handleStatusChange}
                />
              </Field>
              <Field label="Priority">
                <InlineEditSelect
                  value={task.priority}
                  options={PRIORITY_OPTIONS}
                  disabled={!perms.canEditFields}
                  onSave={(next) =>
                    updateField({
                      input: {
                        taskId: task.id,
                        priority: next as ProjectTaskPriority,
                      },
                    })
                  }
                />
              </Field>
            </div>

            <Field label="Description">
              <InlineEditTextarea
                value={task.description ?? ""}
                disabled={!perms.canEditFields}
                placeholder="No description."
                rows={4}
                className="text-sm leading-relaxed text-slate-700 -mx-2"
                onSave={(next) =>
                  updateField({
                    input: { taskId: task.id, description: next },
                  })
                }
              />
            </Field>

            <div>
              <SectionHeading>Details</SectionHeading>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                <Field label="Assignee">
                  <InlineEditSelect
                    value={task.assigneeId ?? UNASSIGNED_VALUE}
                    options={[
                      { value: UNASSIGNED_VALUE, label: "Unassigned" },
                      ...memberOptions,
                    ]}
                    disabled={!perms.canEditFields}
                    onSave={(next) =>
                      updateField({
                        input: {
                          taskId: task.id,
                          assigneeId:
                            next === UNASSIGNED_VALUE ? null : next,
                        },
                      })
                    }
                  />
                </Field>
                <Field label="Due date">
                  {perms.canEditFields ? (
                    <Input
                      type="date"
                      value={
                        task.dueDate
                          ? new Date(task.dueDate).toISOString().slice(0, 10)
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        void updateField({
                          input: {
                            taskId: task.id,
                            dueDate: v ? new Date(v) : null,
                          },
                        });
                      }}
                    />
                  ) : (
                    <StaticValue>
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "—"}
                    </StaticValue>
                  )}
                </Field>
                <Field label="Created by">
                  <StaticValue>
                    {task.createdBy
                      ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                      : "—"}
                  </StaticValue>
                </Field>
                <Field label="Created">
                  <StaticValue>
                    {new Date(task.createdAt).toLocaleString()}
                  </StaticValue>
                </Field>
                {task.completedAt && (
                  <Field label="Completed">
                    <StaticValue>
                      {new Date(task.completedAt).toLocaleString()}
                    </StaticValue>
                  </Field>
                )}
              </dl>
            </div>

            <div>
              <SectionHeading>Activity</SectionHeading>
              <TaskActivityTimeline
                events={activityData?.projectTaskActivity ?? []}
                comments={commentsData?.projectTaskComments ?? []}
                canEditComment={perms.canEditComment}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
              />
            </div>
          </div>

          <SheetFooter className="border-t border-slate-200 px-6 py-3 gap-2 mt-0">
            <Textarea
              rows={2}
              value={draftComment}
              onChange={(e) => setDraftComment(e.target.value)}
              placeholder="Add a comment… (⌘/Ctrl + Enter to send)"
              className="text-sm resize-none"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                  e.preventDefault();
                  void handleAddComment();
                }
              }}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => void handleAddComment()}
                disabled={!draftComment.trim()}
              >
                Send
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-700">
            This will permanently delete "{task.title}" and all its comments.
            This cannot be undone.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteTask()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-2">
      {children}
    </h3>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function StaticValue({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-slate-700">{children}</div>;
}
