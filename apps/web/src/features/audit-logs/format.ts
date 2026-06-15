import type { AuditEventType } from "@/lib/api/audit-logs";

export const auditEventTypes = [
  "SERVER_CREATED",
  "SERVER_UPDATED",
  "SERVER_DELETED",
  "SERVER_MARKED_ONLINE_BY_AGENT",
  "SERVER_MARKED_OFFLINE_BY_AGENT",
  "AGENT_CONFIGURED",
  "AGENT_PULL_SUCCEEDED",
  "AGENT_PULL_FAILED",
  "AGENT_MARKED_ONLINE",
  "AGENT_MARKED_OFFLINE",
  "AGENT_DECOMMISSIONED",
] as const satisfies AuditEventType[];

const auditEventLabels: Partial<Record<AuditEventType, string>> = {
  AGENT_CONFIGURED: "Agent configured",
  AGENT_PULL_SUCCEEDED: "Agent pull succeeded",
  AGENT_PULL_FAILED: "Agent pull failed",
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
