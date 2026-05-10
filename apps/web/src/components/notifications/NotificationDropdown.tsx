import { Link } from "react-router-dom";
import { CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, total, unreadCount, loading, markRead, markAllRead } =
    useNotifications({ take: 10 });

  return (
    <div className="flex w-[22rem] flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          <p className="text-xs text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => void markAllRead()}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <Separator />

      <div className="max-h-[26rem] overflow-y-auto p-1">
        {loading && notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-slate-500">
            <Inbox className="h-8 w-8 text-slate-300" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={markRead}
              onNavigateAway={onClose}
            />
          ))
        )}
      </div>

      <Separator />

      <div className="px-1 py-1">
        <Link to="/notifications" onClick={onClose}>
          <Button variant="ghost" size="sm" className="w-full text-xs">
            View all{total > 10 ? ` (${total})` : ""}
          </Button>
        </Link>
      </div>
    </div>
  );
}
