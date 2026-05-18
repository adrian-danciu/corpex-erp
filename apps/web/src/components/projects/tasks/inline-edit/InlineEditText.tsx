import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  onSave: (next: string) => Promise<void> | void;
}

export function InlineEditText({
  value,
  placeholder,
  disabled,
  className,
  inputClassName,
  onSave,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
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

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
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
          "w-full text-left rounded-md px-2 py-1 hover:bg-slate-100 disabled:hover:bg-transparent disabled:cursor-default",
          className,
        )}
      >
        {value || (
          <span className="text-slate-400">{placeholder ?? "—"}</span>
        )}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => void commit()}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={inputClassName}
    />
  );
}
