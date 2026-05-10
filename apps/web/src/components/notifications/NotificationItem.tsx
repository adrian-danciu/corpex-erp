import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NotificationTypeIcon } from "./NotificationTypeIcon";
import type { Notification } from "@/types/notifications.types";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void | Promise<void>;
  onNavigateAway?: () => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
  onNavigateAway,
}: NotificationItemProps) {
  const navigate = useNavigate();

  const handleClick = async () => {
    if (!notification.isRead) {
      await onMarkRead(notification.id);
    }
    if (notification.linkPath) {
      navigate(notification.linkPath);
      onNavigateAway?.();
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
  });

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors",
        "hover:bg-slate-50",
        !notification.isRead && "bg-slate-50/60",
      )}
    >
      <NotificationTypeIcon type={notification.type} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "text-sm leading-snug text-slate-900 line-clamp-2",
              !notification.isRead && "font-semibold",
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead && (
            <span
              aria-label="Unread"
              className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500"
            />
          )}
        </div>
        {notification.body && (
          <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">{timeAgo}</p>
      </div>
    </button>
  );
}
