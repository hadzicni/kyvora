export type NotificationSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  severity: NotificationSeverity;
  read: boolean;
  createdAt: string;
  readAt: string | null;
  relatedResourceType: string | null;
  relatedResourceId: string | null;
  relatedResourceUrl: string | null;
  dismissible: boolean;
};

export type NotificationPage = {
  content: NotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type UnreadNotificationCount = {
  count: number;
};
