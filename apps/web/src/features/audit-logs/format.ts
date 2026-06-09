import type { AuditEventType } from "@/lib/api/audit-logs";

export const auditEventTypes = [
  "SERVER_CREATED",
  "SERVER_UPDATED",
  "SERVER_DELETED",
  "SERVER_MARKED_ONLINE_BY_AGENT",
  "SERVER_MARKED_OFFLINE_BY_AGENT",
  "AGENT_REGISTERED",
  "AGENT_ENROLLED",
  "AGENT_CONNECTED",
  "AGENT_HEARTBEAT_RECEIVED",
  "AGENT_MARKED_ONLINE",
  "AGENT_MARKED_OFFLINE",
  "AGENT_TOKEN_ROTATED",
  "AGENT_ENROLLMENT_CANCELED",
  "AGENT_DECOMMISSIONED",
] as const satisfies AuditEventType[];

const auditEventLabels: Partial<Record<AuditEventType, string>> = {
  AGENT_DECOMMISSIONED: "Agent decommissioned",
};

export const aggregateTypes = ["SERVER", "AGENT"] as const;

export function formatAuditEventType(value: AuditEventType) {
  const mapped = auditEventLabels[value];
  if (mapped) {
    return mapped;
  }

  const label = value.toLowerCase().replaceAll("_", " ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
