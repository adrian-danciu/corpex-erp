import { useDroppable } from "@dnd-kit/react";
import { cn } from "@/lib/utils";
import type { ProjectTask, ProjectTaskStatus } from "@/types/project.types";
import { TaskCard } from "./TaskCard";

interface Props {
  status: ProjectTaskStatus;
  label: string;
  className: string;
  tasks: ProjectTask[];
  onOpenTask: (taskId: string) => void;
  draggableTaskIds: Set<string>;
  pendingTaskIds: Set<string>;
}

export function TaskColumn({
  status,
  label,
  className,
  tasks,
  onOpenTask,
  draggableTaskIds,
  pendingTaskIds,
}: Props) {
  const { ref, isDropTarget } = useDroppable({
    id: `column:${status}`,
    type: "column",
    accept: "task",
    data: { status },
  });

  return (
    <div
      ref={ref as (element: HTMLDivElement | null) => void}
      className={cn(
        "rounded-lg p-2 min-h-[300px] border border-slate-200 transition-colors",
        className,
        isDropTarget && "ring-2 ring-blue-300 bg-opacity-80",
      )}
    >
      <div className="font-medium text-sm text-slate-700 mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-slate-500">{tasks.length}</span>
      </div>
      <div className="space-y-2 min-h-[40px]">
        {tasks.map((task, idx) => (
          <TaskCard
            key={task.id}
            task={task}
            index={idx}
            columnStatus={status}
            onOpen={onOpenTask}
            draggable={draggableTaskIds.has(task.id)}
            isPending={pendingTaskIds.has(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
