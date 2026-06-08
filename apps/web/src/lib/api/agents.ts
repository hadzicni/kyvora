export type AgentStatus = "PENDING" | "ONLINE" | "OFFLINE" | "UNKNOWN";

export type Agent = {
  id: string;
  name: string;
  hostname: string;
  version: string;
  status: AgentStatus;
  lastSeenAt: string | null;
  registeredAt: string;
  updatedAt: string;
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
  name: string;
  hostname: string;
  version: string;
};

export type AgentHeartbeatInput = {
  status: AgentStatus;
  version?: string;
};

export class AgentApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "AgentApiError";
  }
}

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
    } catch {
      // Keep the status-derived fallback if the response is not JSON.
    }

    throw new AgentApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();

  if (!body) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

export async function listAgents(
  params: ListAgentsParams = {}
): Promise<AgentPage> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 0);
  appendParam(searchParams, "size", params.size ?? 20);
  appendParam(searchParams, "sort", params.sort ?? "registeredAt,desc");

  return request<AgentPage>(`/api/agents?${searchParams.toString()}`);
}

export async function getAgent(id: string): Promise<Agent> {
  return request<Agent>(`/api/agents/${encodeURIComponent(id)}`);
}

export async function registerAgent(input: RegisterAgentInput): Promise<Agent> {
  return request<Agent>("/api/agents/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function sendAgentHeartbeat({
  id,
  input,
}: {
  id: string;
  input: AgentHeartbeatInput;
}): Promise<Agent> {
  return request<Agent>(`/api/agents/${encodeURIComponent(id)}/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export const agentKeys = {
  all: ["agents"] as const,
  list: (params: ListAgentsParams = {}) =>
    [...agentKeys.all, "list", params] as const,
  detail: (id: string) => [...agentKeys.all, "detail", id] as const,
};
