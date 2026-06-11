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
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app/app-shell";
import { NotAuthorized } from "@/components/app/not-authorized";
import { PageHeader } from "@/components/app/page-header";
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
import { canReadSettings, canUpdateSettings } from "@/lib/permissions";
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
  const t = useTranslations();

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-10 text-center">
        <CircleAlert className="mx-auto size-8 text-destructive" />
        <div>
          <h2 className="text-base font-medium">{t("settings.unavailableTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("settings.unavailableDescription")}
          </p>
        </div>
        <Button className="mx-auto" onClick={onRetry} variant="outline">
          <RotateCcw className="size-4" />
          {t("actions.retry")}
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
  const t = useTranslations();
  const { data: session, status: sessionStatus } = useSession();
  const mayReadSettings = canReadSettings(session?.user.permissions);
  const mayUpdateSettings = canUpdateSettings(session?.user.permissions);
  const settingsQuery = useSettings(mayReadSettings);
  const updateSettingsMutation = useUpdateSettings();
  const statusQuery = useQuery({
    queryKey: statusKeys.status,
    queryFn: getStatus,
    enabled: mayReadSettings,
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
      toast.success(t("settings.savedToast"));
    } catch (error) {
      if (error instanceof SettingsApiError && error.details.length > 0) {
        toast.error(error.details[0]);
        return;
      }
      toast.error(
        error instanceof Error ? error.message : t("settings.saveFailed")
      );
    }
  }

  const saving = isSubmitting || updateSettingsMutation.isPending;
  const status = statusQuery.data;

  if (sessionStatus !== "loading" && !mayReadSettings) {
    return (
      <AppShell>
        <NotAuthorized description={t("settings.notAuthorized")} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            <Badge className="w-fit" variant="outline">
              <MonitorCog className="size-3" />
              {t("common.system")}
            </Badge>
          }
          eyebrow={
            <>
              <Settings className="size-4" />
              {t("common.administration")}
            </>
          }
          subtitle={t("settings.subtitle")}
          title={t("settings.title")}
        />

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
                  <CardTitle>{t("settings.instance")}</CardTitle>
                  <CardDescription>
                    {t("settings.instanceDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="instance-name">{t("settings.instanceName")}</Label>
                    <Input
                      id="instance-name"
                      aria-invalid={Boolean(errors.instanceName)}
                      disabled={!mayUpdateSettings || saving}
                      {...register("instanceName")}
                    />
                    {fieldError(errors.instanceName)}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="instance-description">{t("forms.description")}</Label>
                    <Textarea
                      id="instance-description"
                      aria-invalid={Boolean(errors.instanceDescription)}
                      className="min-h-24"
                      disabled={!mayUpdateSettings || saving}
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
                    {t("settings.agentMonitoring")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.agentMonitoringDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="offline-threshold">
                      {t("settings.offlineThreshold")}
                    </Label>
                    <Input
                      id="offline-threshold"
                      inputMode="numeric"
                      min={30}
                      max={86400}
                      type="number"
                      aria-invalid={Boolean(errors.offlineThresholdSeconds)}
                      disabled={!mayUpdateSettings || saving}
                      {...register("offlineThresholdSeconds", {
                        valueAsNumber: true,
                      })}
                    />
                    {fieldError(errors.offlineThresholdSeconds)}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="offline-check-interval">
                      {t("settings.offlineCheckInterval")}
                    </Label>
                    <Input
                      id="offline-check-interval"
                      inputMode="numeric"
                      min={5}
                      max={3600}
                      type="number"
                      aria-invalid={Boolean(errors.offlineCheckIntervalSeconds)}
                      disabled={!mayUpdateSettings || saving}
                      {...register("offlineCheckIntervalSeconds", {
                        valueAsNumber: true,
                      })}
                    />
                    {fieldError(errors.offlineCheckIntervalSeconds)}
                  </div>
                  <div className="rounded-md border bg-muted/20 p-3 text-sm leading-6 text-muted-foreground sm:col-span-2">
                    {t("settings.thresholdHelp")}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>{t("settings.ui")}</CardTitle>
                  <CardDescription>
                    {t("settings.uiDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4 rounded-md border bg-muted/20 p-3">
                    <div>
                      <Label className="text-sm font-medium">
                        {t("settings.showDevHints")}
                      </Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("settings.showDevHintsDescription")}
                      </p>
                    </div>
                    <Toggle
                      checked={showDevHints}
                      disabled={!mayUpdateSettings || saving}
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
                    {t("settings.about")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.aboutDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label={t("help.product")} value="Kyvora" />
                  <InfoRow
                    label={t("help.version")}
                    value={
                      statusQuery.isLoading
                        ? `${t("common.loading")}...`
                        : status?.version && status.version !== "unknown"
                          ? status.version
                          : t("common.unavailable")
                    }
                  />
                  <InfoRow
                    label="API"
                    value={statusQuery.isError ? t("common.unavailable") : t("common.healthy")}
                  />
                  <InfoRow label="Service" value={status?.service ?? "API"} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="size-4" />
                    {t("settings.storagePolicy")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.storagePolicyDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                  <p>
                    {t("settings.storagePolicyText1")}
                  </p>
                  <p>
                    {t("settings.storagePolicyText2")}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-center justify-between gap-3 pt-4">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {isDirty ? t("settings.unsavedChanges") : t("settings.noChanges")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("settings.saveDescription")}
                    </div>
                  </div>
                  <Button disabled={!mayUpdateSettings || !isDirty || saving} type="submit">
                    {saving ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : isDirty ? (
                      <Save className="size-4" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    {t("actions.save")}
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
