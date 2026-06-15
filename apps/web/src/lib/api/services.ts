import { apiRequest, appendSearchParam, ApiRequestError } from "@/lib/api/client";

export type ServiceProtocol = "HTTP" | "HTTPS" | "TCP" | "UDP";
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
  tags: string[];
  notes: string;
  linkedServerId: string | null;
};

export type UpdateServiceInput = CreateServiceInput;

export class ServiceApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "ServiceApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new ServiceApiError(message, status, details)
  );

export async function listServices(
  params: ListServicesParams = {}
): Promise<ManagedServicePage> {
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "page", params.page ?? 0);
  appendSearchParam(searchParams, "size", params.size ?? 20);
  appendSearchParam(searchParams, "q", params.q);
  appendSearchParam(searchParams, "name", params.name);
  appendSearchParam(searchParams, "hostname", params.hostname);
  appendSearchParam(searchParams, "ipAddress", params.ipAddress);
  appendSearchParam(searchParams, "protocol", params.protocol);
  appendSearchParam(searchParams, "category", params.category);
  appendSearchParam(searchParams, "tags", params.tags);
  appendSearchParam(searchParams, "linkedServerId", params.linkedServerId);
  appendSearchParam(searchParams, "sort", params.sort);

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
