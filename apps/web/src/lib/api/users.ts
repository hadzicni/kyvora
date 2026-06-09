import type { UserRole } from "@/lib/permissions";

export type { UserRole };

export type UserAccount = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  enabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  email: string;
  displayName: string;
  role: UserRole;
  temporaryPassword: string;
  mustChangePassword: boolean;
};

export type UpdateUserInput = {
  displayName: string;
  role: UserRole;
};

export type ResetUserPasswordInput = {
  newTemporaryPassword: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export class UsersApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "UsersApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let details: string[] = [];

    try {
      const body = (await response.json()) as {
        message?: string;
        details?: string[];
      };
      message = body.message ?? message;
      details = Array.isArray(body.details) ? body.details : [];
    } catch {
      // Use the status-derived fallback for non-JSON responses.
    }

    throw new UsersApiError(message, response.status, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  return body ? (JSON.parse(body) as T) : (undefined as T);
}

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
