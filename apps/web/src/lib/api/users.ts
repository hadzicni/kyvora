import type { PermissionPreset, UserPermission } from "@/lib/permissions";
import { apiRequest, ApiRequestError } from "@/lib/api/client";

export type { PermissionPreset, UserPermission };

export type UserAccount = {
  id: string;
  email: string;
  displayName: string;
  permissions: UserPermission[];
  enabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  email: string;
  displayName: string;
  permissionPreset?: PermissionPreset;
  permissions: UserPermission[];
  temporaryPassword: string;
  mustChangePassword: boolean;
};

export type UpdateUserInput = {
  displayName: string;
  permissionPreset?: PermissionPreset;
  permissions: UserPermission[];
};

export type ResetUserPasswordInput = {
  newTemporaryPassword: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export class UsersApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "UsersApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new UsersApiError(message, status, details)
  );

export function listUsers(): Promise<UserAccount[]> {
  return request<UserAccount[]>("/api/users");
}

export function getUser(id: string): Promise<UserAccount> {
  return request<UserAccount>(`/api/users/${encodeURIComponent(id)}`);
}

export function createUser(input: CreateUserInput): Promise<UserAccount> {
  return request<UserAccount>("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateUser({
  id,
  input,
}: {
  id: string;
  input: UpdateUserInput;
}): Promise<UserAccount> {
  return request<UserAccount>(`/api/users/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function disableUser(id: string): Promise<UserAccount> {
  return request<UserAccount>(`/api/users/${encodeURIComponent(id)}/disable`, {
    method: "POST",
  });
}

export function enableUser(id: string): Promise<UserAccount> {
  return request<UserAccount>(`/api/users/${encodeURIComponent(id)}/enable`, {
    method: "POST",
  });
}

export function resetUserPassword({
  id,
  input,
}: {
  id: string;
  input: ResetUserPasswordInput;
}): Promise<void> {
  return request<void>(`/api/users/${encodeURIComponent(id)}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function changePassword(input: ChangePasswordInput): Promise<void> {
  return request<void>("/api/me/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
};
