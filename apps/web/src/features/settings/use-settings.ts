"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { auditLogKeys } from "@/lib/api/audit-logs";
import {
  getSettings,
  settingsKeys,
  updateSettings,
  type UpdateSettingsPayload,
} from "@/lib/api/settings";

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: getSettings,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) => updateSettings(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: settingsKeys.all }),
        queryClient.invalidateQueries({ queryKey: auditLogKeys.all }),
      ]);
    },
  });
}
