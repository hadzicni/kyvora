import type { AuditEventType } from "@/lib/api/audit-logs";

export const auditEventTypes = [
  "SERVER_CREATED",
  "SERVER_UPDATED",
  "SERVER_DELETED",
  "AGENT_REGISTERED",
  "AGENT_HEARTBEAT_RECEIVED",
  "AGENT_MARKED_OFFLINE",
] as const satisfies AuditEventType[];

export const aggregateTypes = ["SERVER", "AGENT"] as const;

export function formatAuditEventType(value: AuditEventType) {
  const label = value.toLowerCase().replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
