import type {
  NotificationItem,
  NotificationPage,
  UnreadNotificationCount,
} from "@/features/notifications/types/notification";
import { apiRequest, appendSearchParam } from "@/lib/api/client";
import { ApiError } from "@/lib/api/servers";

export type ListNotificationsParams = {
  page?: number;
  size?: number;
  sort?: string;
};

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new ApiError(message, status, details)
  );

export async function listNotifications(
  params: ListNotificationsParams = {}
): Promise<NotificationPage> {
  const searchParams = new URLSearchParams();
  appendSearchParam(searchParams, "page", params.page ?? 0);
  appendSearchParam(searchParams, "size", params.size ?? 20);
  appendSearchParam(searchParams, "sort", params.sort ?? "createdAt,desc");

  return request<NotificationPage>(`/api/notifications?${searchParams.toString()}`);
}

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCount> {
  return request<UnreadNotificationCount>("/api/notifications/unread-count");
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  return request<NotificationItem>(
    `/api/notifications/${encodeURIComponent(id)}/read`,
    { method: "POST" }
  );
}

export async function markAllNotificationsRead(): Promise<void> {
  await request<void>("/api/notifications/read-all", { method: "POST" });
}

export async function dismissNotification(id: string): Promise<void> {
  await request<void>(`/api/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params: ListNotificationsParams = {}) =>
    [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};
