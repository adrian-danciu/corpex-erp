import { Input } from "@/components/ui/input";
import {
  ProjectTaskPriority,
  ProjectTaskStatus,
  type ProjectTask,
} from "@/types/project.types";
import type { TaskPermissions } from "@/lib/projectTaskPermissions";
import { InlineEditSelect } from "../inline-edit/InlineEditSelect";
import { InlineEditTextarea } from "../inline-edit/InlineEditTextarea";
import { Field, SectionHeading, StaticValue } from "./TaskDetailPrimitives";
import { formatDate, formatDateTime } from "@/lib/formatters";

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

interface TaskFieldsPanelProps {
  handleStatusChange: (next: string) => Promise<void>;
  memberOptions: Array<{ value: string; label: string }>;
  perms: TaskPermissions;
  task: ProjectTask;
  updateField: (vars: { input: Record<string, unknown> }) => Promise<void>;
}

export function TaskFieldsPanel({
  handleStatusChange,
  memberOptions,
  perms,
  task,
  updateField,
}: TaskFieldsPanelProps) {
  return (
    <>
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
          className="-mx-2 text-sm leading-relaxed text-slate-700"
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
                    assigneeId: next === UNASSIGNED_VALUE ? null : next,
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
                onChange={(event) => {
                  const value = event.target.value;
                  void updateField({
                    input: {
                      taskId: task.id,
                      dueDate: value ? new Date(value) : null,
                    },
                  });
                }}
              />
            ) : (
              <StaticValue>
                {formatDate(task.dueDate)}
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
            <StaticValue>{formatDateTime(task.createdAt)}</StaticValue>
          </Field>
          {task.completedAt && (
            <Field label="Completed">
              <StaticValue>
                {formatDateTime(task.completedAt)}
              </StaticValue>
            </Field>
          )}
        </dl>
      </div>
    </>
  );
}
