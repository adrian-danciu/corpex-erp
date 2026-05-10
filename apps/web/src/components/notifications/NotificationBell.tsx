import { useState } from "react";
import { Bell } from "lucide-react";
import { useQuery } from "@apollo/client/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MY_UNREAD_COUNT_QUERY } from "@/graphql/mutations/notifications.mutations";
import type { MyUnreadCountData } from "@/types/notifications.types";
import { NotificationDropdown } from "./NotificationDropdown";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Top-nav bell. Owns the unread-count query (lightweight, polls every 30 min)
 * and lazily mounts the dropdown (which fetches the full list) only when open.
 * Refetches on open so the user sees fresh state immediately.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const { data, refetch } = useQuery<MyUnreadCountData>(MY_UNREAD_COUNT_QUERY, {
    pollInterval: POLL_INTERVAL_MS,
    fetchPolicy: "cache-and-network",
  });

  const unreadCount = data?.myUnreadNotificationCount ?? 0;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void refetch();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full",
                "bg-red-500 px-1 text-[10px] font-semibold text-white",
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto p-0"
      >
        {open && <NotificationDropdown onClose={() => setOpen(false)} />}
      </PopoverContent>
    </Popover>
  );
}
