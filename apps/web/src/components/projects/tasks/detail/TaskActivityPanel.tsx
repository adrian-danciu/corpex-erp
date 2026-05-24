import type {
  ProjectFeedEntry,
  ProjectTaskComment,
} from "@/types/project.types";
import type { TaskPermissions } from "@/lib/projectTaskPermissions";
import { TaskActivityTimeline } from "../TaskActivityTimeline";
import { SectionHeading } from "./TaskDetailPrimitives";

interface TaskActivityPanelProps {
  comments: ProjectTaskComment[];
  events: ProjectFeedEntry[];
  onDeleteComment: (commentId: string) => Promise<void>;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  perms: TaskPermissions;
}

export function TaskActivityPanel({
  comments,
  events,
  onDeleteComment,
  onUpdateComment,
  perms,
}: TaskActivityPanelProps) {
  return (
    <div>
      <SectionHeading>Activity</SectionHeading>
      <TaskActivityTimeline
        events={events}
        comments={comments}
        canEditComment={perms.canEditComment}
        onUpdateComment={onUpdateComment}
        onDeleteComment={onDeleteComment}
      />
    </div>
  );
}
