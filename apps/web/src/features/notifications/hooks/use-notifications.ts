"use client";

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  dismissNotification,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationKeys,
  type ListNotificationsParams,
} from "@/features/notifications/api/notifications";

export function useNotifications(
  params: ListNotificationsParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => listNotifications(params),
    enabled,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadNotificationCount,
    enabled,
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: async () => {
      await invalidateNotifications(queryClient);
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await invalidateNotifications(queryClient);
    },
  });
}

export function useDismissNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dismissNotification,
    onSuccess: async () => {
      await invalidateNotifications(queryClient);
    },
  });
}

async function invalidateNotifications(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  ]);
}
