import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  className?: string;
  onSave: (next: string) => Promise<void> | void;
}

export function InlineEditTextarea({
  value,
  placeholder,
  disabled,
  rows = 4,
  className,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const commit = async () => {
    const next = draft.trim();
    if (next === value.trim()) {
      setEditing(false);
      return;
    }
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setDraft(value);
      setEditing(false);
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void commit();
    }
  };

  if (disabled || !editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setDraft(value);
          setEditing(true);
        }}
        className={cn(
          "w-full text-left rounded-md px-2 py-1 hover:bg-slate-100 disabled:hover:bg-transparent disabled:cursor-default whitespace-pre-wrap min-h-[2.5rem]",
          className,
        )}
      >
        {value || (
          <span className="text-slate-400">{placeholder ?? "No description."}</span>
        )}
      </button>
    );
  }

  return (
    <Textarea
      ref={ref}
      rows={rows}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
    />
  );
}
