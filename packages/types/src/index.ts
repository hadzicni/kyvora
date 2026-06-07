export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export type ServerStatus = "ONLINE" | "OFFLINE" | "UNKNOWN";

export interface ServerSummary {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  status: ServerStatus;
}
