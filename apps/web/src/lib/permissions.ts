export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";

export function isUserRole(role: string | null | undefined): role is UserRole {
  return role === "ADMIN" || role === "OPERATOR" || role === "VIEWER";
}

export function canManageUsers(role: string | null | undefined) {
  return role === "ADMIN";
}

export function canManageSettings(role: string | null | undefined) {
  return role === "ADMIN";
}

export function canManageServers(role: string | null | undefined) {
  return role === "ADMIN" || role === "OPERATOR";
}

export function canManageServices(role: string | null | undefined) {
  return role === "ADMIN" || role === "OPERATOR";
}

export function canDeleteServers(role: string | null | undefined) {
  return role === "ADMIN";
}

export function canManageAgents(role: string | null | undefined) {
  return role === "ADMIN" || role === "OPERATOR";
}

export function canViewOnly(role: string | null | undefined) {
  return role === "VIEWER";
}
