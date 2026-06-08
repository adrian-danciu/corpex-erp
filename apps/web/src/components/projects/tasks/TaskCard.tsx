import { useSortable } from "@dnd-kit/react/sortable";
import { Maximize2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  ProjectTaskPriority,
  type ProjectTask,
  type ProjectTaskStatus,
} from "@/types/project.types";
import { formatDate } from "@/lib/formatters";

const PRIORITY_BADGE: Record<ProjectTaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

interface Props {
  task: ProjectTask;
  index: number;
  columnStatus: ProjectTaskStatus;
  onOpen: (taskId: string) => void;
  draggable: boolean;
  isPending: boolean;
}

export function TaskCard({
  task,
  index,
  columnStatus,
  onOpen,
  draggable,
  isPending,
}: Props) {
  const { ref, isDragging } = useSortable({
    id: task.id,
    index,
    type: "task",
    accept: "task",
    group: columnStatus,
    disabled: !draggable,
    data: { taskId: task.id, status: columnStatus },
  });

  return (
    <div
      ref={ref as (element: HTMLDivElement | null) => void}
      className={cn(
        "relative w-full text-left rounded-md bg-white border border-slate-200 p-2 shadow-sm hover:shadow transition-all select-none group",
        draggable && !isPending && "cursor-grab active:cursor-grabbing",
        !draggable && !isPending && "cursor-default",
        isDragging && "opacity-50 rotate-2 shadow-lg",
        isPending && "opacity-70 cursor-wait",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onOpen(task.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-1 top-1 h-6 w-6 text-slate-400 opacity-60 transition-opacity hover:bg-slate-100 hover:text-slate-700 focus:opacity-100 group-hover:opacity-100"
        aria-label="Open task details"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>

      {isPending && (
        <div className="absolute top-1 left-1 text-slate-400">
          <Spinner className="size-3" />
        </div>
      )}

      <div className="text-sm font-medium text-slate-900 mb-1 line-clamp-2 pr-6">
        {task.title}
      </div>
      <div className="flex items-center justify-between text-xs">
        <Badge
          variant="outline"
          className={cn("border-transparent", PRIORITY_BADGE[task.priority])}
        >
          {task.priority}
        </Badge>
        {task.assignee ? (
          <span className="text-slate-600">
            {task.assignee.firstName} {task.assignee.lastName.charAt(0)}.
          </span>
        ) : (
          <span className="text-slate-400">Unassigned</span>
        )}
      </div>
      {task.dueDate && (
        <div className="text-xs text-slate-500 mt-1">
          Due: {formatDate(task.dueDate)}
        </div>
      )}
    </div>
  );
}
