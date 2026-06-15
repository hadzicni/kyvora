import { apiRequest, appendSearchParam, ApiRequestError } from "@/lib/api/client";

export type ServerStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export type ServerHostFacts = {
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

export type ServerInventoryItem = {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  description: string;
  tags: string[];
  operatingSystem: string;
  status: ServerStatus;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
  hostFacts: ServerHostFacts | null;
};

export type ServerInventoryPage = {
  content: ServerInventoryItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ListServersParams = {
  page?: number;
  size?: number;
  q?: string;
  status?: ServerStatus;
  name?: string;
  hostname?: string;
  ipAddress?: string;
  tags?: string[];
  sort?: string;
};

export type CreateServerInput = {
  name: string;
  hostname: string;
  ipAddress: string;
  description: string;
  tags: string[];
  operatingSystem: string;
  status: ServerStatus;
};

export type UpdateServerInput = CreateServerInput;

export class ApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "ApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new ApiError(message, status, details)
  );

export async function listServers(
  params: ListServersParams = {}
): Promise<ServerInventoryPage> {
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "page", params.page ?? 0);
  appendSearchParam(searchParams, "size", params.size ?? 20);
  appendSearchParam(searchParams, "q", params.q);
  appendSearchParam(searchParams, "status", params.status);
  appendSearchParam(searchParams, "name", params.name);
  appendSearchParam(searchParams, "hostname", params.hostname);
  appendSearchParam(searchParams, "ipAddress", params.ipAddress);
  appendSearchParam(searchParams, "tags", params.tags);
  appendSearchParam(searchParams, "sort", params.sort);

  return request<ServerInventoryPage>(
    `/api/server-inventory?${searchParams.toString()}`
  );
}

export async function getServer(id: string): Promise<ServerInventoryItem> {
  return request<ServerInventoryItem>(
    `/api/server-inventory/${encodeURIComponent(id)}`
  );
}

export async function createServer(
  input: CreateServerInput
): Promise<ServerInventoryItem> {
  return request<ServerInventoryItem>("/api/server-inventory", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function updateServer({
  id,
  input,
}: {
  id: string;
  input: UpdateServerInput;
}): Promise<ServerInventoryItem> {
  return request<ServerInventoryItem>(
    `/api/server-inventory/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );
}

export async function deleteServer(id: string): Promise<void> {
  await request<void>(`/api/server-inventory/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export const serverKeys = {
  all: ["servers"] as const,
  list: (params: ListServersParams = {}) =>
    [...serverKeys.all, "list", params] as const,
  detail: (id: string) => [...serverKeys.all, "detail", id] as const,
};
