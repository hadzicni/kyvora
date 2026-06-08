"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createServer,
  deleteServer,
  listServers,
  serverKeys,
  updateServer,
  type CreateServerInput,
  type ListServersParams,
  type UpdateServerInput,
} from "@/lib/api/servers";

export function useServers(params: ListServersParams = {}) {
  return useQuery({
    queryKey: serverKeys.list(params),
    queryFn: () => listServers(params),
  });
}

export function useCreateServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServerInput) => createServer(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverKeys.all });
    },
  });
}

export function useUpdateServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServerInput }) =>
      updateServer({ id, input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverKeys.all });
    },
  });
}

export function useDeleteServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteServer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: serverKeys.all });
    },
  });
}
