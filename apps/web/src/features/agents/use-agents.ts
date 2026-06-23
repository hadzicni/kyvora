"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { auditLogKeys } from "@/lib/api/audit-logs";
import {
  agentKeys,
  AgentApiError,
  removeAgent,
  getAgent,
  listAgents,
  pullAgent,
  registerAgent,
  testAgentConnection,
  type ListAgentsParams,
  type Agent,
  type RegisterAgentInput,
} from "@/lib/api/agents";
import { dashboardKeys } from "@/lib/api/dashboard";
import { serverKeys } from "@/lib/api/servers";

export function useAgents(params: ListAgentsParams = {}, enabled = true) {
  return useQuery({
    queryKey: agentKeys.list(params),
    queryFn: () => listAgents(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAgent(
  id: string,
  options: Pick<
    UseQueryOptions<Agent, AgentApiError>,
    "enabled" | "refetchInterval"
  > = {}
) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => getAgent(id),
    enabled: id.length > 0 && (options.enabled ?? true),
    refetchInterval: options.refetchInterval,
    retry: (failureCount, error) =>
      error instanceof AgentApiError && error.status === 404
        ? false
        : failureCount < 3,
  });
}

export function useRegisterAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterAgentInput) => registerAgent(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.all }),
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: serverKeys.all }),
      ]);
    },
  });
}

export function useTestAgentConnection() {
  return useMutation({
    mutationFn: testAgentConnection,
  });
}

export function usePullAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pullAgent(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.all }),
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: serverKeys.all }),
      ]);
    },
  });
}

export function useRemoveAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeAgent(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.all }),
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.invalidateQueries({ queryKey: serverKeys.all }),
      ]);
    },
  });
}
