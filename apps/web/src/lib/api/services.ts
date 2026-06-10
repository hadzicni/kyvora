export type ServiceProtocol = "HTTP" | "HTTPS" | "TCP" | "UDP";
export type ServiceStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";
export type ServiceCategory =
  | "MONITORING"
  | "NETWORKING"
  | "MEDIA"
  | "STORAGE"
  | "SECURITY"
  | "DEVELOPMENT"
  | "DATABASES"
  | "AUTOMATION"
  | "PRODUCTIVITY"
  | "INFRASTRUCTURE"
  | "OTHER";

export type LinkedServer = {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
};

export type ManagedServiceItem = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  hostname: string | null;
  ipAddress: string | null;
  port: number | null;
  protocol: ServiceProtocol;
  category: ServiceCategory;
  status: ServiceStatus;
  tags: string[];
  notes: string | null;
  linkedServer: LinkedServer | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedServicePage = {
  content: ManagedServiceItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ListServicesParams = {
  page?: number;
  size?: number;
  q?: string;
  name?: string;
  hostname?: string;
  ipAddress?: string;
  protocol?: ServiceProtocol;
  category?: ServiceCategory;
  status?: ServiceStatus;
  tags?: string[];
  linkedServerId?: string;
  sort?: string;
};

export type CreateServiceInput = {
  name: string;
  description: string;
  url: string;
  hostname: string;
  ipAddress: string;
  port: number | null;
  protocol: ServiceProtocol;
  category: ServiceCategory;
  status: ServiceStatus;
  tags: string[];
  notes: string;
  linkedServerId: string | null;
};

export type UpdateServiceInput = CreateServiceInput;

export class ServiceApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "ServiceApiError";
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

    throw new ServiceApiError(message, response.status, details);
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

export async function listServices(
  params: ListServicesParams = {}
): Promise<ManagedServicePage> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 0);
  appendParam(searchParams, "size", params.size ?? 20);
  appendParam(searchParams, "q", params.q);
  appendParam(searchParams, "name", params.name);
  appendParam(searchParams, "hostname", params.hostname);
  appendParam(searchParams, "ipAddress", params.ipAddress);
  appendParam(searchParams, "protocol", params.protocol);
  appendParam(searchParams, "category", params.category);
  appendParam(searchParams, "status", params.status);
  appendParam(searchParams, "tags", params.tags);
  appendParam(searchParams, "linkedServerId", params.linkedServerId);
  appendParam(searchParams, "sort", params.sort);

  return request<ManagedServicePage>(`/api/services?${searchParams.toString()}`);
}

export async function getService(id: string): Promise<ManagedServiceItem> {
  return request<ManagedServiceItem>(`/api/services/${encodeURIComponent(id)}`);
}

export async function createService(
  input: CreateServiceInput
): Promise<ManagedServiceItem> {
  return request<ManagedServiceItem>("/api/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function updateService({
  id,
  input,
}: {
  id: string;
  input: UpdateServiceInput;
}): Promise<ManagedServiceItem> {
  return request<ManagedServiceItem>(`/api/services/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function deleteService(id: string): Promise<void> {
  await request<void>(`/api/services/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export const serviceKeys = {
  all: ["services"] as const,
  list: (params: ListServicesParams = {}) =>
    [...serviceKeys.all, "list", params] as const,
  detail: (id: string) => [...serviceKeys.all, "detail", id] as const,
};
