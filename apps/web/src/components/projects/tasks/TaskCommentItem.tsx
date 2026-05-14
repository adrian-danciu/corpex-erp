import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectTaskComment } from "@/types/project.types";

interface Props {
  comment: ProjectTaskComment;
  canEdit: boolean;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function TaskCommentItem({
  comment,
  canEdit,
  onUpdate,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  const initial =
    (comment.author?.firstName?.charAt(0) ?? "") +
    (comment.author?.lastName?.charAt(0) ?? "");

  const save = async () => {
    const next = draft.trim();
    if (!next || next === comment.content) {
      setEditing(false);
      setDraft(comment.content);
      return;
    }
    try {
      await onUpdate(comment.id, next);
      setEditing(false);
    } catch {
      setDraft(comment.content);
      setEditing(false);
    }
  };

  return (
    <div className="flex gap-2 items-start">
      <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-700">
        {initial || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span className="font-medium text-slate-700">
            {comment.author
              ? `${comment.author.firstName} ${comment.author.lastName}`
              : "Unknown"}
          </span>
          <span>· {new Date(comment.createdAt).toLocaleString()}</span>
          {comment.updatedAt !== comment.createdAt && (
            <span className="italic">(edited)</span>
          )}
        </div>
        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void save()}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setDraft(comment.content);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-800 whitespace-pre-wrap mt-1">
            {comment.content}
          </div>
        )}
        {canEdit && !editing && (
          <div className="flex gap-1 mt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs gap-1"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" /> Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs gap-1 text-red-600 hover:text-red-700"
              onClick={() => void onDelete(comment.id)}
            >
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
