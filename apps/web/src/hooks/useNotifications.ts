import { useQuery, useMutation } from "@apollo/client/react";
import {
  MY_NOTIFICATIONS_QUERY,
  MY_UNREAD_COUNT_QUERY,
  MARK_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
} from "@/graphql/mutations/notifications.mutations";
import type {
  MyNotificationsData,
  MyUnreadCountData,
  Notification,
  NotificationFilter,
} from "@/types/notifications.types";

const POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

interface UseNotificationsOptions {
  /** How many to fetch. Defaults to 10 (dropdown size). */
  take?: number;
  skip?: number;
  filter?: NotificationFilter;
  /** Background polling cadence in ms. Set to 0 to disable polling. */
  pollIntervalMs?: number;
}

/**
 * Notifications data + read mutations + 30 min background poll.
 * The component using this hook is the one in charge of triggering refetches
 * on user-explicit actions (e.g. opening the bell dropdown).
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    take = 10,
    skip = 0,
    filter,
    pollIntervalMs = POLL_INTERVAL_MS,
  } = options;

  const listQuery = useQuery<MyNotificationsData>(MY_NOTIFICATIONS_QUERY, {
    variables: {
      pagination: { skip, take },
      filter,
    },
    pollInterval: pollIntervalMs || undefined,
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const countQuery = useQuery<MyUnreadCountData>(MY_UNREAD_COUNT_QUERY, {
    pollInterval: pollIntervalMs || undefined,
    fetchPolicy: "cache-and-network",
  });

  const [markReadMutation] = useMutation(MARK_NOTIFICATION_READ_MUTATION, {
    refetchQueries: [MY_UNREAD_COUNT_QUERY],
  });

  const [markAllReadMutation] = useMutation(
    MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    {
      refetchQueries: [MY_NOTIFICATIONS_QUERY, MY_UNREAD_COUNT_QUERY],
    },
  );

  const items: Notification[] = listQuery.data?.myNotifications.items ?? [];
  const total = listQuery.data?.myNotifications.meta.total ?? 0;
  const unreadCount = countQuery.data?.myUnreadNotificationCount ?? 0;

  const refetch = async () => {
    await Promise.all([listQuery.refetch(), countQuery.refetch()]);
  };

  const markRead = async (id: string) => {
    await markReadMutation({ variables: { id } });
    // Optimistic-ish: refetch the list so the row reflects the new isRead state
    await listQuery.refetch();
  };

  const markAllRead = async () => {
    await markAllReadMutation();
  };

  return {
    notifications: items,
    total,
    unreadCount,
    loading: listQuery.loading || countQuery.loading,
    refetch,
    markRead,
    markAllRead,
  };
}
