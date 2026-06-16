import { Link } from "react-router-dom";
import { ArrowRight, Bell, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";

const WIDGET_SIZE = 5;

export function NotificationsWidget() {
  const { notifications, total, unreadCount, loading, markRead } =
    useNotifications({ take: WIDGET_SIZE });

  return (
    <Card className="w-full min-w-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Recent Notifications</CardTitle>
          {unreadCount > 0 && (
            <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link to="/notifications">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View all{total > WIDGET_SIZE ? ` (${total})` : ""}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-1">
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
  );
}
