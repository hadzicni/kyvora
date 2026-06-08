export type ServerStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

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
};

export type ServerInventoryPage = {
  content: ServerInventoryItem[];
  page?: number;
  size?: number;
  number?: number;
  totalElements: number;
  totalPages: number;
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

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function appendParam(searchParams: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => appendParam(searchParams, key, entry));
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

    throw new ApiError(message, response.status, details);
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

export async function listServers(
  params: ListServersParams = {}
): Promise<ServerInventoryPage> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 0);
  appendParam(searchParams, "size", params.size ?? 20);
  appendParam(searchParams, "q", params.q);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "name", params.name);
  appendParam(searchParams, "hostname", params.hostname);
  appendParam(searchParams, "ipAddress", params.ipAddress);
  appendParam(searchParams, "tags", params.tags);

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
