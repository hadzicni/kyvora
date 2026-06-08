export type AuditEventType =
  | "SERVER_CREATED"
  | "SERVER_UPDATED"
  | "SERVER_DELETED";

export type AuditLog = {
  id: string;
  eventType: AuditEventType;
  aggregateType: string;
  aggregateId: string;
  actor: string;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type AuditLogPage = {
  content: AuditLog[];
  page?: number;
  size?: number;
  number?: number;
  totalElements: number;
  totalPages: number;
};

export type ListAuditLogsParams = {
  page?: number;
  size?: number;
  aggregateType?: string;
  aggregateId?: string;
  eventType?: AuditEventType;
};

export class AuditLogApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "AuditLogApiError";
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

    throw new AuditLogApiError(message, response.status, details);
  }

  return (await response.json()) as T;
}

export async function listAuditLogs(
  params: ListAuditLogsParams = {}
): Promise<AuditLogPage> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "page", params.page ?? 0);
  appendParam(searchParams, "size", params.size ?? 10);
  appendParam(searchParams, "aggregateType", params.aggregateType);
  appendParam(searchParams, "aggregateId", params.aggregateId);
  appendParam(searchParams, "eventType", params.eventType);

  return request<AuditLogPage>(`/api/audit-logs?${searchParams.toString()}`);
}

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (params: ListAuditLogsParams = {}) =>
    [...auditLogKeys.all, "list", params] as const,
};
