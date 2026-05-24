import type { ReactNode } from "react";

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
      {children}
    </h3>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      {children}
    </div>
  );
}

export function StaticValue({ children }: { children: ReactNode }) {
  return <div className="text-sm text-slate-700">{children}</div>;
}
