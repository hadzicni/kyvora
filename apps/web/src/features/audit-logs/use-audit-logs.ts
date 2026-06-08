"use client";

import { useQuery } from "@tanstack/react-query";

import {
  auditLogKeys,
  listAuditLogs,
  type ListAuditLogsParams,
} from "@/lib/api/audit-logs";

export function useAuditLogs(params: ListAuditLogsParams = {}) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => listAuditLogs(params),
  });
}
