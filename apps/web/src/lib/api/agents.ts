import { apiRequest, appendSearchParam, ApiRequestError } from "@/lib/api/client";

export type AgentStatus =
  | "ONLINE"
  | "OFFLINE"
  | "UNKNOWN";

export type AgentHostFacts = {
  hostname: string | null;
  operatingSystem: string | null;
  platform: string | null;
  kernelVersion: string | null;
  architecture: string | null;
  cpuCount: number | null;
  memoryTotalBytes: number | null;
  diskTotalBytes: number | null;
  diskFreeBytes: number | null;
  uptimeSeconds: number | null;
  ipAddresses: string[];
  agentVersion: string | null;
  collectedAt: string | null;
  updatedAt: string | null;
};

export type Agent = {
  id: string;
  name: string;
  serverId: string | null;
  serverName: string | null;
  serverHostname: string | null;
  hostname: string;
  version: string;
  status: AgentStatus;
  lastSeenAt: string | null;
  baseUrl: string;
  pullEnabled: boolean;
  lastPullAt: string | null;
  lastSuccessfulPullAt: string | null;
  lastPullError: string | null;
  capabilities: string[];
  registeredAt: string;
  updatedAt: string;
  hostFacts: AgentHostFacts | null;
};

export type AgentPage = {
  content: Agent[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ListAgentsParams = {
  page?: number;
  size?: number;
  sort?: string;
};

export type RegisterAgentInput = {
  serverId: string;
  name?: string;
  baseUrl: string;
  sharedSecret: string;
  pullEnabled?: boolean;
};

export type AgentPullResult = {
  agent: Agent;
  status: AgentStatus;
  pulledAt: string;
  error: string | null;
};

export class AgentApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "AgentApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new AgentApiError(message, status, details)
  );

export async function listAgents(
  params: ListAgentsParams = {}
): Promise<AgentPage> {
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "page", params.page ?? 0);
  appendSearchParam(searchParams, "size", params.size ?? 20);
  appendSearchParam(searchParams, "sort", params.sort ?? "registeredAt,desc");

  return request<AgentPage>(`/api/agents?${searchParams.toString()}`);
}

export async function getAgent(id: string): Promise<Agent> {
  return request<Agent>(`/api/agents/${encodeURIComponent(id)}`);
}

export async function registerAgent(
  input: RegisterAgentInput
): Promise<Agent> {
  return request<Agent>("/api/agents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function pullAgent(id: string): Promise<AgentPullResult> {
  return request<AgentPullResult>(`/api/agents/${encodeURIComponent(id)}/pull`, {
    method: "POST",
  });
}

export async function decommissionAgent(id: string): Promise<Agent> {
  return request<Agent>(
    `/api/agents/${encodeURIComponent(id)}/decommission`,
    {
      method: "POST",
    }
  );
}

export const agentKeys = {
  all: ["agents"] as const,
  list: (params: ListAgentsParams = {}) =>
    [...agentKeys.all, "list", params] as const,
  detail: (id: string) => [...agentKeys.all, "detail", id] as const,
};
