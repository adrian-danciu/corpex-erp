import { gql } from "@apollo/client";

const NOTIFICATION_FIELDS = gql`
  fragment NotificationFields on Notification {
    id
    type
    title
    body
    linkPath
    entityType
    entityId
    isRead
    readAt
    createdAt
  }
`;

export const MY_NOTIFICATIONS_QUERY = gql`
  ${NOTIFICATION_FIELDS}
  query MyNotifications(
    $pagination: PaginationInput
    $filter: NotificationFilterInput
  ) {
    myNotifications(pagination: $pagination, filter: $filter) {
      items {
        ...NotificationFields
      }
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const MY_UNREAD_COUNT_QUERY = gql`
  query MyUnreadNotificationCount {
    myUnreadNotificationCount
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  ${NOTIFICATION_FIELDS}
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id) {
      ...NotificationFields
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;
