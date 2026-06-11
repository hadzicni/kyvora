export type UserPermission =
  | "DASHBOARD_READ"
  | "AUDIT_LOG_READ"
  | "NETWORK_MAP_READ"
  | "USER_READ"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DISABLE"
  | "USER_ENABLE"
  | "USER_PASSWORD_RESET"
  | "SETTINGS_READ"
  | "SETTINGS_UPDATE"
  | "SERVER_READ"
  | "SERVER_CREATE"
  | "SERVER_UPDATE"
  | "SERVER_DELETE"
  | "SERVICE_READ"
  | "SERVICE_CREATE"
  | "SERVICE_UPDATE"
  | "SERVICE_DELETE"
  | "AGENT_READ"
  | "AGENT_ENROLL"
  | "AGENT_CANCEL_ENROLLMENT"
  | "AGENT_ROTATE_TOKEN"
  | "AGENT_DECOMMISSION";

export type PermissionPreset = "ADMIN" | "OPERATOR" | "VIEWER";

export type ServerStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export interface ServerSummary {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  status: ServerStatus;
}
