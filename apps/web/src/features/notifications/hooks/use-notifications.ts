"use client";

import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

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

export function useToastNotification() {
  return {
    info: (title: string, description?: string) =>
      toast.info(title, { description }),
    success: (title: string, description?: string) =>
      toast.success(title, { description }),
    warning: (title: string, description?: string) =>
      toast.warning(title, { description }),
    error: (title: string, description?: string) =>
      toast.error(title, { description }),
    critical: (title: string, description?: string) =>
      toast.error(title, { description }),
  };
}

async function invalidateNotifications(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  ]);
}
