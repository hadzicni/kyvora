"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createServer,
  listServers,
  serverKeys,
  type CreateServerInput,
  type ListServersParams,
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
