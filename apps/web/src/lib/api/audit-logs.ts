import { apiRequest, appendSearchParam, ApiRequestError } from "@/lib/api/client";

export type AuditEventType =
  | "SERVER_CREATED"
  | "SERVER_UPDATED"
  | "SERVER_DELETED"
  | "SERVER_MARKED_ONLINE_BY_AGENT"
  | "SERVER_MARKED_OFFLINE_BY_AGENT"
  | "AGENT_REGISTERED"
  | "AGENT_ENROLLED"
  | "AGENT_CONNECTED"
  | "AGENT_HEARTBEAT_RECEIVED"
  | "AGENT_MARKED_ONLINE"
  | "AGENT_MARKED_OFFLINE"
  | "AGENT_TOKEN_ROTATED"
  | "AGENT_ENROLLMENT_CANCELED"
  | "AGENT_DECOMMISSIONED";

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
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

export type ListAuditLogsParams = {
  page?: number;
  size?: number;
  aggregateType?: string;
  aggregateId?: string;
  eventType?: AuditEventType;
};

export class AuditLogApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "AuditLogApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new AuditLogApiError(message, status, details)
  );

export async function listAuditLogs(
  params: ListAuditLogsParams = {}
): Promise<AuditLogPage> {
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "page", params.page ?? 0);
  appendSearchParam(searchParams, "size", params.size ?? 10);
  appendSearchParam(searchParams, "aggregateType", params.aggregateType);
  appendSearchParam(searchParams, "aggregateId", params.aggregateId);
  appendSearchParam(searchParams, "eventType", params.eventType);

  return request<AuditLogPage>(`/api/audit-logs?${searchParams.toString()}`);
}

export const auditLogKeys = {
  all: ["audit-logs"] as const,
  list: (params: ListAuditLogsParams = {}) =>
    [...auditLogKeys.all, "list", params] as const,
};
