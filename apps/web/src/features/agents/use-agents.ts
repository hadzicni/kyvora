"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { auditLogKeys } from "@/lib/api/audit-logs";
import {
  agentKeys,
  AgentApiError,
  getAgent,
  listAgents,
  registerAgent,
  sendAgentHeartbeat,
  type AgentHeartbeatInput,
  type ListAgentsParams,
  type RegisterAgentInput,
} from "@/lib/api/agents";
import { dashboardKeys } from "@/lib/api/dashboard";

export function useAgents(params: ListAgentsParams = {}) {
  return useQuery({
    queryKey: agentKeys.list(params),
    queryFn: () => listAgents(params),
    placeholderData: keepPreviousData,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => getAgent(id),
    enabled: id.length > 0,
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
      ]);
    },
  });
}

export function useSendAgentHeartbeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AgentHeartbeatInput }) =>
      sendAgentHeartbeat({ id, input }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: agentKeys.all }),
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]);
    },
  });
}
