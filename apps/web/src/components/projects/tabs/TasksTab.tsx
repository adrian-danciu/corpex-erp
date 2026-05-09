import { useState, type DragEvent } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { GET_PROJECT_TASKS_QUERY } from "@/graphql/mutations/project.queries";
import {
  CREATE_PROJECT_TASK_MUTATION,
  TRANSITION_PROJECT_TASK_MUTATION,
} from "@/graphql/mutations/project.mutations";
import { cn } from "@/lib/utils";
import {
  ProjectTaskPriority,
  ProjectTaskStatus,
  type Project,
  type ProjectTask,
} from "@/types/project.types";

interface Props {
  project: Project;
  isProjectManager: boolean;
}

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
  {
    status: ProjectTaskStatus.DONE,
    label: "Done",
    className: "bg-green-50",
  },
  {
    status: ProjectTaskStatus.BLOCKED,
    label: "Blocked",
    className: "bg-red-50",
  },
];

const PRIORITY_BADGE: Record<ProjectTaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

export function TasksTab({ project, isProjectManager }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<ProjectTaskPriority>(
    ProjectTaskPriority.MEDIUM,
  );
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const variables = { projectId: project.id };

  const { data, refetch } = useQuery<{ projectTasks: ProjectTask[] }>(
    GET_PROJECT_TASKS_QUERY,
    { variables, fetchPolicy: "cache-and-network" },
  );

  const [createTask, { loading: creating }] = useMutation(
    CREATE_PROJECT_TASK_MUTATION,
    {
      onCompleted: () => {
        setCreateOpen(false);
        setTitle("");
        setDescription("");
        setAssigneeId("");
        setPriority(ProjectTaskPriority.MEDIUM);
        setDueDate("");
        refetch();
      },
      onError: (e) => setError(e.message),
    },
  );

  const [transitionTask] = useMutation(TRANSITION_PROJECT_TASK_MUTATION, {
    onCompleted: () => refetch(),
    onError: (e) => setError(e.message),
  });

  const tasks = data?.projectTasks ?? [];
  const memberOptions =
    project.members?.filter((m) => !m.leftAt && m.user) ?? [];

  const tasksByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.status] = tasks.filter((t) => t.status === col.status);
      return acc;
    },
    {} as Record<ProjectTaskStatus, ProjectTask[]>,
  );

  const onDrop = (e: DragEvent<HTMLDivElement>, status: ProjectTaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;
    transitionTask({
      variables: { input: { taskId, status } },
    });
  };

  const submitCreate = () => {
    setError("");
    if (!title.trim()) {
      setError("Title required");
      return;
    }
    createTask({
      variables: {
        input: {
          projectId: project.id,
          title: title.trim(),
          description: description || undefined,
          assigneeId: assigneeId || undefined,
          priority,
          dueDate: dueDate ? new Date(dueDate) : undefined,
        },
      },
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tasks</CardTitle>
          {isProjectManager && (
            <Button
              size="sm"
              onClick={() => {
                setError("");
                setCreateOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New task
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {COLUMNS.map((col) => (
              <div
                key={col.status}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, col.status)}
                className={cn(
                  "rounded-lg p-2 min-h-[300px] border border-slate-200",
                  col.className,
                )}
              >
                <div className="font-medium text-sm text-slate-700 mb-2 flex items-center justify-between">
                  <span>{col.label}</span>
                  <span className="text-xs text-slate-500">
                    {tasksByStatus[col.status].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasksByStatus[col.status].map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", task.id)
                      }
                      className="rounded-md bg-white border border-slate-200 p-2 cursor-grab shadow-sm"
                    >
                      <div className="text-sm font-medium text-slate-900 mb-1">
                        {task.title}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-transparent",
                            PRIORITY_BADGE[task.priority],
                          )}
                        >
                          {task.priority}
                        </Badge>
                        {task.assignee ? (
                          <span className="text-slate-600">
                            {task.assignee.firstName}{" "}
                            {task.assignee.lastName.charAt(0)}.
                          </span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </div>
                      {task.dueDate && (
                        <div className="text-xs text-slate-500 mt-1">
                          Due:{" "}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberOptions.map((m) => (
                      <SelectItem key={m.userId} value={m.userId}>
                        {m.user?.firstName} {m.user?.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) =>
                    setPriority(v as ProjectTaskPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProjectTaskPriority.LOW}>
                      Low
                    </SelectItem>
                    <SelectItem value={ProjectTaskPriority.MEDIUM}>
                      Medium
                    </SelectItem>
                    <SelectItem value={ProjectTaskPriority.HIGH}>
                      High
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Due date (optional)</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={submitCreate} disabled={creating}>
                {creating ? "Saving..." : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
