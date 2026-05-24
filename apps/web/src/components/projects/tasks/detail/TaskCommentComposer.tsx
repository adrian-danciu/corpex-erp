import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TaskCommentComposerProps {
  draftComment: string;
  onSend: () => void;
  setDraftComment: (comment: string) => void;
}

export function TaskCommentComposer({
  draftComment,
  onSend,
  setDraftComment,
}: TaskCommentComposerProps) {
  return (
    <>
      <Textarea
        rows={2}
        value={draftComment}
        onChange={(event) => setDraftComment(event.target.value)}
        placeholder="Add a comment… (⌘/Ctrl + Enter to send)"
        className="resize-none text-sm"
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSend();
          }
        }}
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={onSend} disabled={!draftComment.trim()}>
          Send
        </Button>
      </div>
    </>
  );
}
