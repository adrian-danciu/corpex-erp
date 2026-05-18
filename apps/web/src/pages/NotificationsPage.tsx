import { useMemo, useState } from "react";
import { CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/common/Pagination";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import type {
  NotificationFilter,
  NotificationType,
} from "@/types/notifications.types";

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<NotificationType, string> = {
  LEAVE_REQUEST_SUBMITTED: "Leave submitted",
  LEAVE_REQUEST_APPROVED: "Leave approved",
  LEAVE_REQUEST_REJECTED: "Leave rejected",
  PROJECT_TASK_ASSIGNED: "Task assigned",
  FLEET_DOCUMENT_EXPIRING: "Document expiring",
  EMPLOYEE_DOCUMENT_EXPIRING: "Employee document expiring",
  STOCK_BELOW_MINIMUM: "Stock low",
};

type ReadFilter = "all" | "unread" | "read";

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");

  const filter: NotificationFilter | undefined = useMemo(() => {
    const f: NotificationFilter = {};
    if (readFilter === "unread") f.isRead = false;
    if (readFilter === "read") f.isRead = true;
    if (typeFilter !== "all") f.type = typeFilter;
    return Object.keys(f).length ? f : undefined;
  }, [readFilter, typeFilter]);

  const { notifications, total, unreadCount, loading, markRead, markAllRead } =
    useNotifications({
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      filter,
    });

  const handleFilterChange = <T,>(setter: (v: T) => void, value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void markAllRead()}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-base">Inbox</CardTitle>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select
                value={readFilter}
                onValueChange={(v) =>
                  handleFilterChange(setReadFilter, v as ReadFilter)
                }
              >
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={typeFilter}
                onValueChange={(v) =>
                  handleFilterChange(
                    setTypeFilter,
                    v as NotificationType | "all",
                  )
                }
              >
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {(Object.keys(TYPE_LABELS) as NotificationType[]).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABELS[t]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-1">
          {loading && notifications.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Loading...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-slate-500">
              <Inbox className="h-10 w-10 text-slate-300" />
              <p className="text-sm">No notifications match these filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onMarkRead={markRead}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination
        currentPage={page}
        totalItems={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
