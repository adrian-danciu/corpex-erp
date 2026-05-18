export type NotificationType =
  | "LEAVE_REQUEST_SUBMITTED"
  | "LEAVE_REQUEST_APPROVED"
  | "LEAVE_REQUEST_REJECTED"
  | "PROJECT_TASK_ASSIGNED"
  | "FLEET_DOCUMENT_EXPIRING"
  | "EMPLOYEE_DOCUMENT_EXPIRING"
  | "STOCK_BELOW_MINIMUM";

export type NotificationEntityType =
  | "LEAVE_REQUEST"
  | "PROJECT_TASK"
  | "VEHICLE_DOCUMENT"
  | "EMPLOYEE_DOCUMENT"
  | "PRODUCT";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  linkPath: string | null;
  entityType: NotificationEntityType | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationFilter {
  isRead?: boolean;
  type?: NotificationType;
}

export interface PaginatedNotifications {
  items: Notification[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

export interface MyNotificationsData {
  myNotifications: PaginatedNotifications;
}

export interface MyUnreadCountData {
  myUnreadNotificationCount: number;
}
