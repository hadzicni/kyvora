"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeInfo,
  Check,
  CircleAlert,
  HeartPulse,
  Info,
  Loader2,
  MonitorCog,
  RotateCcw,
  Save,
  Settings,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useSettings, useUpdateSettings } from "@/features/settings/use-settings";
import { getStatus, statusKeys } from "@/lib/api/status";
import { SettingsApiError, type SettingsResponse } from "@/lib/api/settings";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

const settingsSchema = z
  .object({
    instanceName: z
      .string()
      .trim()
      .min(1, "Instance name is required.")
      .max(80, "Instance name must be 80 characters or fewer."),
    instanceDescription: z
      .string()
      .trim()
      .max(240, "Description must be 240 characters or fewer."),
    offlineThresholdSeconds: z
      .number()
      .int("Offline threshold must be a whole number.")
      .min(30, "Offline threshold must be at least 30 seconds.")
      .max(86_400, "Offline threshold must be 86,400 seconds or fewer."),
    offlineCheckIntervalSeconds: z
      .number()
      .int("Check interval must be a whole number.")
      .min(5, "Check interval must be at least 5 seconds.")
      .max(3_600, "Check interval must be 3,600 seconds or fewer."),
    showDevHints: z.boolean(),
  })
  .refine(
    (value) =>
      value.offlineCheckIntervalSeconds <= value.offlineThresholdSeconds,
    {
      path: ["offlineCheckIntervalSeconds"],
      message: "Check interval cannot be greater than the offline threshold.",
    }
  );

type SettingsFormValues = z.output<typeof settingsSchema>;
type SettingsFormPayload = SettingsFormValues;
type FieldName = keyof SettingsFormValues;

const defaultValues: SettingsFormValues = {
  instanceName: "Kyvora",
  instanceDescription: "Homelab Control Plane",
  offlineThresholdSeconds: 90,
  offlineCheckIntervalSeconds: 30,
  showDevHints: true,
};

const keyMap: Record<keyof SettingsFormPayload, string> = {
  instanceName: "instance.name",
  instanceDescription: "instance.description",
  offlineThresholdSeconds: "agents.offline_threshold_seconds",
  offlineCheckIntervalSeconds: "agents.offline_check_interval_seconds",
  showDevHints: "ui.show_dev_hints",
};

function valuesFromSettings(data?: SettingsResponse): SettingsFormValues {
  const byKey = new Map(data?.settings.map((setting) => [setting.key, setting]));

  return {
    instanceName: String(byKey.get(keyMap.instanceName)?.value ?? "Kyvora"),
    instanceDescription: String(
      byKey.get(keyMap.instanceDescription)?.value ?? "Homelab Control Plane"
    ),
    offlineThresholdSeconds: Number(
      byKey.get(keyMap.offlineThresholdSeconds)?.value ?? 90
    ),
    offlineCheckIntervalSeconds: Number(
      byKey.get(keyMap.offlineCheckIntervalSeconds)?.value ?? 30
    ),
    showDevHints: Boolean(byKey.get(keyMap.showDevHints)?.value ?? true),
  };
}

function fieldError(error?: { message?: string }) {
  return error?.message ? (
    <p className="text-xs text-destructive">{error.message}</p>
  ) : null;
}

function Toggle({
  checked,
  disabled,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        "relative h-6 w-11 rounded-full border transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        checked
          ? "border-emerald-500/50 bg-emerald-500/80"
          : "border-border bg-muted"
      )}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        {[0, 1, 2].map((item) => (
          <Card key={item}>
            <CardHeader>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-10 text-center">
        <CircleAlert className="mx-auto size-8 text-destructive" />
        <div>
          <h2 className="text-base font-medium">Settings are unavailable</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The API did not return system settings. Retry after checking the
            backend connection.
          </p>
        </div>
        <Button className="mx-auto" onClick={onRetry} variant="outline">
          <RotateCcw className="size-4" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/20 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium">
        {value}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const settingsQuery = useSettings();
  const updateSettingsMutation = useUpdateSettings();
  const statusQuery = useQuery({
    queryKey: statusKeys.status,
    queryFn: getStatus,
  });

  const form = useForm<SettingsFormValues, unknown, SettingsFormPayload>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const {
    formState: { dirtyFields, errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = form;
  const showDevHints = useWatch({
    control: form.control,
    name: "showDevHints",
  });

  const loadedValues = useMemo(
    () => valuesFromSettings(settingsQuery.data),
    [settingsQuery.data]
  );

  useEffect(() => {
    if (settingsQuery.data) {
      reset(loadedValues);
    }
  }, [loadedValues, reset, settingsQuery.data]);

  async function onSubmit(values: SettingsFormPayload) {
    const changedSettings: Record<string, string | number | boolean> = {};

    (Object.keys(dirtyFields) as FieldName[]).forEach((field) => {
      const settingKey = keyMap[field as keyof SettingsFormPayload];
      if (settingKey) {
        changedSettings[settingKey] = values[field as keyof SettingsFormPayload];
      }
    });

    if (Object.keys(changedSettings).length === 0) {
      return;
    }

    try {
      const response = await updateSettingsMutation.mutateAsync({
        settings: changedSettings,
      });
      reset(valuesFromSettings(response));
      toast.success("Settings saved");
    } catch (error) {
      if (error instanceof SettingsApiError && error.details.length > 0) {
        toast.error(error.details[0]);
        return;
      }
      toast.error(
        error instanceof Error ? error.message : "Settings could not be saved"
      );
    }
  }

  const saving = isSubmitting || updateSettingsMutation.isPending;
  const status = statusQuery.data;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <Settings className="size-5" />
              Settings
            </h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Configure database-backed operational settings for this Kyvora
              instance. Secrets and agent tokens remain outside settings.
            </p>
          </div>
          <Badge className="w-fit" variant="outline">
            <MonitorCog className="size-3" />
            System
          </Badge>
        </div>

        {settingsQuery.isLoading ? <SettingsSkeleton /> : null}

        {settingsQuery.isError ? (
          <ErrorState onRetry={() => void settingsQuery.refetch()} />
        ) : null}

        {settingsQuery.isSuccess ? (
          <form
            className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"
            onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          >
            <div className="space-y-4">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Instance</CardTitle>
                  <CardDescription>
                    Name and description shown to operators in the web UI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="instance-name">Instance name</Label>
                    <Input
                      id="instance-name"
                      aria-invalid={Boolean(errors.instanceName)}
                      {...register("instanceName")}
                    />
                    {fieldError(errors.instanceName)}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instance-description">Description</Label>
                    <Textarea
                      id="instance-description"
                      aria-invalid={Boolean(errors.instanceDescription)}
                      className="min-h-24"
                      {...register("instanceDescription")}
                    />
                    {fieldError(errors.instanceDescription)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="size-4" />
                    Agent monitoring
                  </CardTitle>
                  <CardDescription>
                    Heartbeat windows used to mark agents and linked servers
                    offline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="offline-threshold">
                      Offline threshold seconds
                    </Label>
                    <Input
                      id="offline-threshold"
                      inputMode="numeric"
                      min={30}
                      max={86400}
                      type="number"
                      aria-invalid={Boolean(errors.offlineThresholdSeconds)}
                      {...register("offlineThresholdSeconds", {
                        valueAsNumber: true,
                      })}
                    />
                    {fieldError(errors.offlineThresholdSeconds)}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="offline-check-interval">
                      Offline check interval seconds
                    </Label>
                    <Input
                      id="offline-check-interval"
                      inputMode="numeric"
                      min={5}
                      max={3600}
                      type="number"
                      aria-invalid={Boolean(errors.offlineCheckIntervalSeconds)}
                      {...register("offlineCheckIntervalSeconds", {
                        valueAsNumber: true,
                      })}
                    />
                    {fieldError(errors.offlineCheckIntervalSeconds)}
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3 text-sm leading-6 text-muted-foreground sm:col-span-2">
                    Threshold changes apply to stale-agent detection
                    dynamically. Scheduler interval changes are stored in the
                    database and take effect after the API process restarts.
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>UI</CardTitle>
                  <CardDescription>
                    Presentation settings for local operator workflows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/20 p-3">
                    <div>
                      <Label className="text-sm font-medium">
                        Show development hints
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Enables local setup hints in supported UI surfaces.
                      </p>
                    </div>
                    <Toggle
                      checked={showDevHints}
                      disabled={saving}
                      onCheckedChange={(checked) =>
                        setValue("showDevHints", checked, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BadgeInfo className="size-4" />
                    About
                  </CardTitle>
                  <CardDescription>
                    Release and API status information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Product" value="Kyvora" />
                  <InfoRow
                    label="Version"
                    value={
                      statusQuery.isLoading
                        ? "Loading..."
                        : status?.version && status.version !== "unknown"
                          ? status.version
                          : "Unavailable"
                    }
                  />
                  <InfoRow
                    label="API"
                    value={statusQuery.isError ? "Unavailable" : "Healthy"}
                  />
                  <InfoRow label="Service" value={status?.service ?? "API"} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="size-4" />
                    Storage policy
                  </CardTitle>
                  <CardDescription>
                    Settings are for operational configuration only.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    JWT secrets, database credentials, Auth.js secrets, and
                    agent tokens are not stored in system settings.
                  </p>
                  <p>
                    Agent tokens remain one-time plaintext values and only token
                    hashes are persisted by agent enrollment.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {isDirty ? "Unsaved changes" : "No changes"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Updates are written to the database and audit log.
                    </div>
                  </div>
                  <Button disabled={!isDirty || saving} type="submit">
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : isDirty ? (
                      <Save className="size-4" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Save
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        ) : null}
      </div>
    </AppShell>
  );
}
