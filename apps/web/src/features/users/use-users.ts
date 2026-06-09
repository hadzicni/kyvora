"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { auditLogKeys } from "@/lib/api/audit-logs";
import {
  changePassword,
  createUser,
  disableUser,
  enableUser,
  getUser,
  listUsers,
  resetUserPassword,
  updateUser,
  userKeys,
  type ChangePasswordInput,
  type CreateUserInput,
  type ResetUserPasswordInput,
  type UpdateUserInput,
} from "@/lib/api/users";

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: userKeys.list(),
    queryFn: listUsers,
    enabled,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: id.length > 0,
  });
}

function useUserInvalidation() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
      queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
    ]);
  };
}

export function useCreateUser() {
  const invalidate = useUserInvalidation();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useUserInvalidation();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      updateUser({ id, input }),
    onSuccess: invalidate,
  });
}

export function useDisableUser() {
  const invalidate = useUserInvalidation();

  return useMutation({
    mutationFn: (id: string) => disableUser(id),
    onSuccess: invalidate,
  });
}

export function useEnableUser() {
  const invalidate = useUserInvalidation();

  return useMutation({
    mutationFn: (id: string) => enableUser(id),
    onSuccess: invalidate,
  });
}

export function useResetUserPassword() {
  const invalidate = useUserInvalidation();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ResetUserPasswordInput;
    }) => resetUserPassword({ id, input }),
    onSuccess: invalidate,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changePassword(input),
  });
}
