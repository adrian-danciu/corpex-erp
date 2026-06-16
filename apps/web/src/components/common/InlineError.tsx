import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type InlineErrorProps = {
  children: ReactNode;
  className?: string;
  icon?: boolean;
};

export function InlineError({
  children,
  className,
  icon = true,
}: InlineErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-destructive/50 bg-red-50 px-4 py-3 text-sm text-red-700",
        className,
      )}
    >
      {icon && <AlertCircle className="h-4 w-4 shrink-0" />}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
