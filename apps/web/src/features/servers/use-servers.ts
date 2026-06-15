"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { auditLogKeys } from "@/lib/api/audit-logs";
import { dashboardKeys } from "@/lib/api/dashboard";
import { notificationKeys } from "@/features/notifications/api/notifications";
import {
  createServer,
  deleteServer,
  getServer,
  listServers,
  serverKeys,
  updateServer,
  ApiError,
  type CreateServerInput,
  type ListServersParams,
  type UpdateServerInput,
} from "@/lib/api/servers";

export function useServers(params: ListServersParams = {}, enabled = true) {
  return useQuery({
    queryKey: serverKeys.list(params),
    queryFn: () => listServers(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useServer(id: string) {
  return useQuery({
    queryKey: serverKeys.detail(id),
    queryFn: () => getServer(id),
    enabled: id.length > 0,
    retry: (failureCount, error) =>
      error instanceof ApiError && error.status === 404
        ? false
        : failureCount < 3,
  });
}

export function useCreateServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServerInput) => createServer(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
        queryClient.invalidateQueries({ queryKey: serverKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
}

export function useUpdateServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServerInput }) =>
      updateServer({ id, input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
        queryClient.invalidateQueries({ queryKey: serverKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]);
    },
  });
}

export function useDeleteServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteServer(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
        queryClient.invalidateQueries({ queryKey: serverKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]);
    },
  });
}
