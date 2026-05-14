import { useMemo } from "react";
import type {
  ProjectFeedEntry,
  ProjectTaskComment,
} from "@/types/project.types";
import { TaskCommentItem } from "./TaskCommentItem";

type TimelineRow =
  | { kind: "event"; entry: ProjectFeedEntry; at: string }
  | { kind: "comment"; comment: ProjectTaskComment; at: string };

interface Props {
  events: ProjectFeedEntry[];
  comments: ProjectTaskComment[];
  canEditComment: (c: ProjectTaskComment) => boolean;
  onUpdateComment: (commentId: string, content: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export function TaskActivityTimeline({
  events,
  comments,
  canEditComment,
  onUpdateComment,
  onDeleteComment,
}: Props) {
  const rows = useMemo<TimelineRow[]>(() => {
    const merged: TimelineRow[] = [
      ...events.map<TimelineRow>((e) => ({
        kind: "event",
        entry: e,
        at: e.createdAt,
      })),
      ...comments.map<TimelineRow>((c) => ({
        kind: "comment",
        comment: c,
        at: c.createdAt,
      })),
    ];
    merged.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    return merged;
  }, [events, comments]);

  if (rows.length === 0) {
    return (
      <div className="text-xs text-slate-400 italic">No activity yet.</div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) =>
        row.kind === "event" ? (
          <EventRow key={`e:${row.entry.id}`} entry={row.entry} />
        ) : (
          <TaskCommentItem
            key={`c:${row.comment.id}`}
            comment={row.comment}
            canEdit={canEditComment(row.comment)}
            onUpdate={onUpdateComment}
            onDelete={onDeleteComment}
          />
        ),
      )}
    </div>
  );
}

function EventRow({ entry }: { entry: ProjectFeedEntry }) {
  const initial =
    (entry.author?.firstName?.charAt(0) ?? "") +
    (entry.author?.lastName?.charAt(0) ?? "");
  return (
    <div className="flex gap-2 items-start text-xs text-slate-600">
      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium text-slate-500">
        {initial || "·"}
      </div>
      <div className="flex-1 min-w-0">
        <div>
          <span className="font-medium text-slate-700">
            {entry.author
              ? `${entry.author.firstName} ${entry.author.lastName}`
              : "System"}
          </span>{" "}
          {entry.content}
        </div>
        <div className="text-[11px] text-slate-400">
          {new Date(entry.createdAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
