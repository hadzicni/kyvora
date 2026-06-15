import { apiRequest, ApiRequestError } from "@/lib/api/client";

export type SettingValueType = "STRING" | "BOOLEAN" | "INTEGER";

export type SettingItem = {
  key: string;
  value: string | number | boolean;
  valueType: SettingValueType;
  description: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

export type SettingsResponse = {
  settings: SettingItem[];
};

export type UpdateSettingsPayload = {
  settings: Record<string, string | number | boolean>;
};

export type InstanceSettings = {
  name: string;
  description: string;
};

export class SettingsApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "SettingsApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new SettingsApiError(message, status, details)
  );

export async function getSettings(): Promise<SettingsResponse> {
  return request<SettingsResponse>("/api/settings");
}

export async function updateSettings(
  payload: UpdateSettingsPayload
): Promise<SettingsResponse> {
  return request<SettingsResponse>("/api/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export const settingsKeys = {
  all: ["settings"] as const,
};

export function getSettingValue(
  settings: SettingsResponse | undefined,
  key: string
) {
  return settings?.settings.find((setting) => setting.key === key)?.value;
}

export function getInstanceSettings(
  settings: SettingsResponse | undefined
): InstanceSettings {
  return {
    name: String(getSettingValue(settings, "instance.name") ?? "Kyvora"),
    description: String(
      getSettingValue(settings, "instance.description") ??
        "Homelab Control Plane"
    ),
  };
}
