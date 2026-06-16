import { useState } from "react";
import { useApolloClient } from "@apollo/client/react";
import { useMutationWithToast } from "@/hooks/useMutationWithToast";
import { Plus } from "lucide-react";
import { InlineError } from "@/components/common/InlineError";
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
import { CREATE_PROJECT_TASK_MUTATION } from "@/graphql/mutations/project.mutations";
import { GET_PROJECT_TASKS_QUERY } from "@/graphql/mutations/project.queries";
import {
  ProjectTaskPriority,
  type CreateProjectTaskMutationResult,
  type Project,
  type ProjectTasksQueryResult,
} from "@/types/project.types";
import { TaskBoard } from "@/components/projects/tasks/TaskBoard";

interface Props {
  project: Project;
  isProjectManager: boolean;
}

export function TasksTab({ project, isProjectManager }: Props) {
  const apollo = useApolloClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [priority, setPriority] = useState<ProjectTaskPriority>(
    ProjectTaskPriority.MEDIUM,
  );
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  const [createTask, { loading: creating }] =
    useMutationWithToast<CreateProjectTaskMutationResult>(
      CREATE_PROJECT_TASK_MUTATION,
      {
    successMessage: "Task created",
    onCompleted: (data) => {
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setAssigneeId("");
      setPriority(ProjectTaskPriority.MEDIUM);
      setDueDate("");
      apollo.cache.updateQuery<ProjectTasksQueryResult>(
        {
          query: GET_PROJECT_TASKS_QUERY,
          variables: { projectId: project.id },
        },
        (existing) => ({
          projectTasks: [
            ...(existing?.projectTasks ?? []),
            data.createProjectTask,
          ],
        }),
      );
    },
  });

  const memberOptions =
    project.members?.filter((m) => !m.leftAt && m.user) ?? [];

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
        <InlineError className="p-3 text-red-800" icon={false}>
          {error}
        </InlineError>
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
          <TaskBoard project={project} isProjectManager={isProjectManager} />
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
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
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
                  onValueChange={(v) => setPriority(v as ProjectTaskPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProjectTaskPriority.LOW}>Low</SelectItem>
                    <SelectItem value={ProjectTaskPriority.MEDIUM}>Medium</SelectItem>
                    <SelectItem value={ProjectTaskPriority.HIGH}>High</SelectItem>
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
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
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
