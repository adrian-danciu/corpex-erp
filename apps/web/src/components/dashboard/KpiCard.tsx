import type { ReactNode } from "react";

type KpiCardProps = {
  title: string;
  value: string | number;
  sub: string;
  icon?: ReactNode;
  accent?: string;
};

export function KpiCard({ title, value, sub, icon, accent }: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
