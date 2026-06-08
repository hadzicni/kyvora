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
  status?: ServerStatus;
  name?: string;
  hostname?: string;
  ipAddress?: string;
  tags?: string[];
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
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

    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // Keep the status-derived fallback if the response is not JSON.
    }

    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

export async function listServers(
  params: ListServersParams = {}
): Promise<ServerInventoryPage> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 0);
  appendParam(searchParams, "size", params.size ?? 20);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "name", params.name);
  appendParam(searchParams, "hostname", params.hostname);
  appendParam(searchParams, "ipAddress", params.ipAddress);
  appendParam(searchParams, "tags", params.tags);

  return request<ServerInventoryPage>(
    `/api/server-inventory?${searchParams.toString()}`
  );
}

export const serverKeys = {
  all: ["servers"] as const,
  list: (params: ListServersParams = {}) =>
    [...serverKeys.all, "list", params] as const,
};
