import type {
  NotificationItem,
  NotificationPage,
  UnreadNotificationCount,
} from "@/features/notifications/types/notification";
import { ApiError } from "@/lib/api/servers";

export type ListNotificationsParams = {
  page?: number;
  size?: number;
  sort?: string;
};

function appendParam(searchParams: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return;
  }
  searchParams.append(key, String(value));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let details: string[] = [];

    try {
      const body = (await response.json()) as {
        message?: string;
        details?: string[];
      };
      message = body.message ?? message;
      details = Array.isArray(body.details) ? body.details : [];
    } catch {}

    throw new ApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  return body ? (JSON.parse(body) as T) : (undefined as T);
}

export async function listNotifications(
  params: ListNotificationsParams = {}
): Promise<NotificationPage> {
  const searchParams = new URLSearchParams();
  appendParam(searchParams, "page", params.page ?? 0);
  appendParam(searchParams, "size", params.size ?? 20);
  appendParam(searchParams, "sort", params.sort ?? "createdAt,desc");

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
