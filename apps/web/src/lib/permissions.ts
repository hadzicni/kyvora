export const permissions = [
  "DASHBOARD_READ",
  "AUDIT_LOG_READ",
  "NETWORK_MAP_READ",
  "USER_READ",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_DISABLE",
  "USER_ENABLE",
  "USER_PASSWORD_RESET",
  "SETTINGS_READ",
  "SETTINGS_UPDATE",
  "SERVER_READ",
  "SERVER_CREATE",
  "SERVER_UPDATE",
  "SERVER_DELETE",
  "SERVICE_READ",
  "SERVICE_CREATE",
  "SERVICE_UPDATE",
  "SERVICE_DELETE",
  "AGENT_READ",
  "AGENT_ENROLL",
  "AGENT_CANCEL_ENROLLMENT",
  "AGENT_ROTATE_TOKEN",
  "AGENT_DECOMMISSION",
] as const;

export type UserPermission = (typeof permissions)[number];

export type PermissionPreset = "ADMIN" | "OPERATOR" | "VIEWER";

export const permissionPresets: Record<PermissionPreset, UserPermission[]> = {
  ADMIN: [...permissions],
  OPERATOR: [
    "DASHBOARD_READ",
    "AUDIT_LOG_READ",
    "NETWORK_MAP_READ",
    "SERVER_READ",
    "SERVER_CREATE",
    "SERVER_UPDATE",
    "SERVICE_READ",
    "SERVICE_CREATE",
    "SERVICE_UPDATE",
    "SERVICE_DELETE",
    "AGENT_READ",
    "AGENT_ENROLL",
    "AGENT_CANCEL_ENROLLMENT",
    "AGENT_ROTATE_TOKEN",
    "AGENT_DECOMMISSION",
  ],
  VIEWER: [
    "DASHBOARD_READ",
    "AUDIT_LOG_READ",
    "NETWORK_MAP_READ",
    "SERVER_READ",
    "SERVICE_READ",
    "AGENT_READ",
  ],
};

export function isUserPermission(
  permission: string | null | undefined
): permission is UserPermission {
  return permissions.includes(permission as UserPermission);
}

export function hasPermission(
  assigned: readonly string[] | null | undefined,
  permission: UserPermission
) {
  return Array.isArray(assigned) && assigned.includes(permission);
}

export function can(
  assigned: readonly string[] | null | undefined,
  permission: UserPermission
) {
  return hasPermission(assigned, permission);
}

export function canAccessUserManagement(
  assigned: readonly string[] | null | undefined
) {
  return (
    can(assigned, "USER_READ") ||
    can(assigned, "USER_CREATE") ||
    can(assigned, "USER_UPDATE") ||
    can(assigned, "USER_DISABLE") ||
    can(assigned, "USER_ENABLE") ||
    can(assigned, "USER_PASSWORD_RESET")
  );
}

export function canReadDashboard(assigned: readonly string[] | null | undefined) {
  return can(assigned, "DASHBOARD_READ");
}

export function canReadAuditLogs(assigned: readonly string[] | null | undefined) {
  return can(assigned, "AUDIT_LOG_READ");
}

export function canReadNetworkMap(assigned: readonly string[] | null | undefined) {
  return can(assigned, "NETWORK_MAP_READ");
}

export function canReadSettings(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SETTINGS_READ");
}

export function canUpdateSettings(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SETTINGS_UPDATE");
}

export function canReadServers(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVER_READ");
}

export function canCreateServers(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVER_CREATE");
}

export function canUpdateServers(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVER_UPDATE");
}

export function canDeleteServers(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVER_DELETE");
}

export function canReadServices(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVICE_READ");
}

export function canCreateServices(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVICE_CREATE");
}

export function canUpdateServices(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVICE_UPDATE");
}

export function canDeleteServices(assigned: readonly string[] | null | undefined) {
  return can(assigned, "SERVICE_DELETE");
}

export function canReadAgents(assigned: readonly string[] | null | undefined) {
  return can(assigned, "AGENT_READ");
}

export function canEnrollAgents(assigned: readonly string[] | null | undefined) {
  return can(assigned, "AGENT_ENROLL");
}

export function canCancelAgentEnrollments(
  assigned: readonly string[] | null | undefined
) {
  return can(assigned, "AGENT_CANCEL_ENROLLMENT");
}

export function canRotateAgentTokens(
  assigned: readonly string[] | null | undefined
) {
  return can(assigned, "AGENT_ROTATE_TOKEN");
}

export function canDecommissionAgents(
  assigned: readonly string[] | null | undefined
) {
  return can(assigned, "AGENT_DECOMMISSION");
}

export function canViewOnly(assigned: readonly string[] | null | undefined) {
  return (
    Array.isArray(assigned) &&
    assigned.every((permission) =>
      [
        "DASHBOARD_READ",
        "AUDIT_LOG_READ",
        "NETWORK_MAP_READ",
        "SERVER_READ",
        "SERVICE_READ",
        "AGENT_READ",
      ].includes(permission)
    )
  );
}
