"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Loader2,
  Plus,
  Server,
  Terminal,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AgentApiError,
  type AgentConnectionTestResult,
  type RegisterAgentInput,
} from "@/lib/api/agents";
import type { ServerInventoryItem } from "@/lib/api/servers";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

import { useServers } from "../servers/use-servers";
import {
  useAgents,
  useRegisterAgent,
  useTestAgentConnection,
} from "./use-agents";

const installCommand =
  "curl -fsSL https://raw.githubusercontent.com/hadzicni/kyvora/main/scripts/install-agent.sh | sudo bash";
const serviceCommands = [
  "sudo systemctl status kyvora-agent",
  "sudo systemctl restart kyvora-agent",
  "sudo journalctl -u kyvora-agent -f",
];

function createSchema(t: (key: string) => string) {
  return z.object({
  serverId: z.string().min(1, t("validation.serverRequired")),
  name: z
    .string()
    .trim()
    .max(120, t("validation.nameMax"))
    .optional()
    .refine(
      (value) => !value || value.length >= 2,
      t("validation.nameMin")
    ),
  scheme: z.enum(["http", "https"]),
  host: z
    .string()
    .trim()
    .min(1, t("validation.hostRequired"))
    .max(253, t("validation.hostMax"))
    .refine(
      (value) => !/[/?#@\s]/.test(value),
      t("validation.hostInvalid")
    ),
  port: z.coerce
    .number()
    .int()
    .min(1, t("validation.portMin"))
    .max(65535, t("validation.portMax")),
  basePath: z
    .string()
    .trim()
    .max(200, t("validation.basePathMax"))
    .refine(
      (value) =>
        !value ||
        (value.startsWith("/") &&
          !value.includes("..") &&
          !value.includes("//")),
      t("validation.basePathInvalid")
    ),
  sharedSecret: z
    .string()
    .min(12, t("validation.secretMin"))
    .max(512, t("validation.secretMax")),
  pullEnabled: z.boolean(),
  });
}

type FormInput = z.input<ReturnType<typeof createSchema>>;
type FormValues = z.output<ReturnType<typeof createSchema>>;

function defaults(server?: ServerInventoryItem): FormInput {
  return {
    serverId: server?.id ?? "",
    name: server ? `${server.name} Agent` : "",
    scheme: "http",
    host: server?.ipAddress ?? "",
    port: 9187,
    basePath: "",
    sharedSecret: "",
    pullEnabled: true,
  };
}

function baseUrl(
  values: Pick<FormValues, "scheme" | "host" | "port" | "basePath">
) {
  const host =
    values.host.includes(":") && !values.host.startsWith("[")
      ? `[${values.host}]`
      : values.host;
  return `${values.scheme}://${host}:${values.port}${values.basePath.replace(
    /\/+$/,
    ""
  )}`;
}

export function RegisterAgentDialog({
  initialServer,
  triggerLabel,
}: {
  initialServer?: ServerInventoryItem;
  triggerLabel?: string;
}) {
  const t = useTranslations("agents.setupWizard");
  const schema = useMemo(() => createSchema(t), [t]);
  const steps = [t("steps.overview"), t("steps.install"), t("steps.configure"), t("steps.connect"), t("steps.testSave")];
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AgentConnectionTestResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const registerAgent = useRegisterAgent();
  const testConnection = useTestAgentConnection();
  const serversQuery = useServers({ size: 100 });
  const agentsQuery = useAgents({ size: 200 });
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults(initialServer),
  });
  const values = useWatch({ control: form.control });
  const servers = useMemo(() => {
    const entries = serversQuery.data?.content ?? [];
    return initialServer &&
      !entries.some((server) => server.id === initialServer.id)
      ? [initialServer, ...entries]
      : entries;
  }, [initialServer, serversQuery.data?.content]);
  const assigned = useMemo(
    () =>
      new Set(
        (agentsQuery.data?.content ?? [])
          .map((agent) => agent.serverId)
          .filter(Boolean)
      ),
    [agentsQuery.data?.content]
  );
  const selectedServer = servers.find(
    (server) => server.id === values.serverId
  );
  const busy = registerAgent.isPending || testConnection.isPending;

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) {
      setStep(0);
      setResult(null);
      setFormError(null);
      form.reset(defaults(initialServer));
    }
  }

  function selectServer(id: string) {
    const server = servers.find((entry) => entry.id === id);
    form.setValue("serverId", id, { shouldValidate: true });
    if (server) {
      form.setValue("name", `${server.name} Agent`);
      form.setValue("host", server.ipAddress);
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    toast.success(t("toasts.commandCopied"));
  }

  async function test() {
    setFormError(null);
    const valid = await form.trigger([
      "scheme",
      "host",
      "port",
      "basePath",
      "sharedSecret",
    ]);
    if (!valid) return;
    const current = schema.parse(form.getValues());
    try {
      setResult(
        await testConnection.mutateAsync({
          baseUrl: baseUrl(current),
          sharedSecret: current.sharedSecret,
        })
      );
    } catch (error) {
      setResult(null);
      setFormError(
        error instanceof Error
          ? error.message
          : t("errors.testFailed")
      );
    }
  }

  async function save(current: FormValues) {
    setFormError(null);
    const payload: RegisterAgentInput = {
      serverId: current.serverId,
      name: current.name?.trim() || undefined,
      baseUrl: baseUrl(current),
      sharedSecret: current.sharedSecret,
      pullEnabled: current.pullEnabled,
    };
    try {
      const agent = await registerAgent.mutateAsync(payload);
      toast.success(t("toasts.saved"), { description: agent.name });
      changeOpen(false);
    } catch (error) {
      const message =
        error instanceof AgentApiError && error.status === 409
          ? t("errors.serverAssigned")
          : error instanceof Error
          ? error.message
          : t("errors.saveFailed");
      setFormError(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          {triggerLabel ?? t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-1" aria-label={t("progressLabel")}>
          {steps.map((label, index) => (
            <div
              key={label}
              className={cn(
                "border-b-2 px-1 pb-2 text-center text-[11px] text-muted-foreground sm:text-xs",
                index <= step && "border-primary text-foreground"
              )}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        <form
          onSubmit={(event) => void form.handleSubmit(save)(event)}
          className="min-h-96 space-y-5"
        >
          {formError ? (
            <Notice tone="error" title={t("errors.actionFailed")}>
              {formError}
            </Notice>
          ) : null}
          {step === 0 ? (
            <div className="space-y-5">
              <Notice tone="warning" title={t("overview.linuxOnlyTitle")}>
                {t("overview.linuxOnlyDescription")}
              </Notice>
              <div className="grid gap-3 sm:grid-cols-3">
                <Info title={t("overview.pullBasedTitle")}>
                  {t("overview.pullBasedDescription")}
                </Info>
                <Info title={t("overview.reachabilityTitle")}>
                  {t("overview.reachabilityDescription")}
                </Info>
                <Info title={t("overview.privateTitle")}>
                  {t("overview.privateDescription")}
                </Info>
              </div>
              <Field
                label={t("overview.serverLabel")}
                error={form.formState.errors.serverId?.message}
              >
                <Select
                  value={values.serverId ?? ""}
                  onValueChange={selectServer}
                  disabled={serversQuery.isLoading || agentsQuery.isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("overview.serverPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map((server) => (
                      <SelectItem
                        key={server.id}
                        value={server.id}
                        disabled={
                          assigned.has(server.id) &&
                          server.id !== values.serverId
                        }
                      >
                        {server.name} / {server.hostname}
                        {assigned.has(server.id) ? ` / ${t("overview.assigned")}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedServer ? (
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                    <Server className="size-4" />
                    {selectedServer.ipAddress}
                  </div>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {t("overview.createPrefix")} {" "}
                  <Link
                    className="underline underline-offset-4"
                    href="/servers"
                  >
                    {t("overview.createLink")}
                  </Link>
                  {t("overview.createSuffix")}
                </p>
              </Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <Info title={t("install.targetsTitle")}>
                {t("install.targetsPrefix")} <code>linux/amd64</code> {t("common.or")}{" "}
                <code>linux/arm64</code>.
              </Info>
              <Command value={installCommand} onCopy={copy} />
              <p className="text-sm text-muted-foreground">
                {t("install.description")} <code>kyvora-agent.service</code>.
              </p>
              <div className="space-y-2">
                {serviceCommands.map((command) => (
                  <Command
                    key={command}
                    value={command}
                    onCopy={copy}
                    compact
                  />
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info title={t("configure.configFile")}>
                  <code>/etc/kyvora/agent.yaml</code>
                </Info>
                <Info title={t("configure.secretFile")}>
                  <code>/etc/kyvora/agent.secret</code>
                </Info>
              </div>
              <Notice tone="warning" title={t("configure.listenerTitle")}>
                {t("configure.listenerPrefix")} <code>server.listenAddress</code>{" "}
                {t("configure.listenerSuffix")}
              </Notice>
              <p className="text-sm text-muted-foreground">
                {t("configure.logsPrefix")} <code>sudo journalctl -u kyvora-agent -f</code>{" "}
                {t("configure.logsSuffix")}
              </p>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-[140px_1fr_130px]">
                <Field
                  label={t("connect.scheme")}
                  error={form.formState.errors.scheme?.message}
                >
                  <Select
                    value={values.scheme}
                    onValueChange={(value) => {
                      form.setValue("scheme", value as "http" | "https");
                      setResult(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="http">http</SelectItem>
                      <SelectItem value="https">https</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("connect.host")} error={form.formState.errors.host?.message}>
                  <Input
                    placeholder="10.0.0.15"
                    {...form.register("host")}
                    onChange={(e) => {
                      form.register("host").onChange(e);
                      setResult(null);
                    }}
                  />
                </Field>
                <Field label={t("connect.port")} error={form.formState.errors.port?.message}>
                  <Input type="number" {...form.register("port")} />
                </Field>
              </div>
              <Field
                label={t("connect.basePath")}
                error={form.formState.errors.basePath?.message}
              >
                <Input placeholder="/agent" {...form.register("basePath")} />
              </Field>
              <Field
                label={t("connect.agentName")}
                error={form.formState.errors.name?.message}
              >
                <Input {...form.register("name")} />
              </Field>
              <Field
                label={t("connect.sharedSecret")}
                error={form.formState.errors.sharedSecret?.message}
              >
                <Input
                  type="password"
                  autoComplete="new-password"
                  {...form.register("sharedSecret")}
                />
                <p className="text-xs text-muted-foreground">
                  {t("connect.secretPrefix")} <code>/etc/kyvora/agent.secret</code>. {t("connect.secretSuffix")}
                </p>
              </Field>
              <label className="flex items-center gap-3 rounded-md border p-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  {...form.register("pullEnabled")}
                />
                {t("connect.pullEnabled")}
              </label>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <Info title={t("test.connectionTarget")}>
                <code>
                  {String(values.scheme ?? "http")}://
                  {String(values.host || "host")}:{String(values.port ?? 9187)}
                  {String(values.basePath ?? "")}
                </code>
              </Info>
              <Button
                type="button"
                variant="outline"
                onClick={() => void test()}
                disabled={busy}
              >
                {testConnection.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Terminal className="size-4" />
                )}
                {t("test.action")}
              </Button>
              {result ? (
                <TestResult result={result} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("test.hint")}
                </p>
              )}
              {result && !result.success ? (
                <Troubleshooting code={result.errorCode} />
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="border-t pt-4 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0 || busy}
              onClick={() => setStep((value) => value - 1)}
            >
              <ChevronLeft className="size-4" />
              {t("actions.back")}
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (step === 0 && !(await form.trigger("serverId"))) return;
                  setStep((value) => value + 1);
                }}
              >
                {t("actions.next")}
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={busy}>
                {registerAgent.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                {t("actions.save")}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
function Info({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-4">
      <p className="mb-1 text-sm font-medium">{title}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
function Notice({
  tone,
  title,
  children,
}: {
  tone: "warning" | "error";
  title: string;
  children: React.ReactNode;
}) {
  const Icon = tone === "error" ? XCircle : AlertTriangle;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border p-4 text-sm",
        tone === "error"
          ? "border-destructive/40 bg-destructive/10"
          : "border-amber-500/40 bg-amber-500/10"
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <div className="mt-1 text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
function Command({
  value,
  onCopy,
  compact = false,
}: {
  value: string;
  onCopy: (value: string) => void;
  compact?: boolean;
}) {
  const t = useTranslations("agents.setupWizard");
  return (
    <div className="flex items-center gap-2 rounded-md border bg-zinc-950 p-2 text-zinc-100">
      <code
        className={cn(
          "min-w-0 flex-1 overflow-x-auto text-xs",
          !compact && "p-2"
        )}
      >
        {value}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-zinc-100 hover:bg-zinc-800 hover:text-white"
        aria-label={t("actions.copyCommand")}
        onClick={() => void onCopy(value)}
      >
        <Clipboard className="size-4" />
      </Button>
    </div>
  );
}
function TestResult({ result }: { result: AgentConnectionTestResult }) {
  const t = useTranslations("agents.setupWizard");
  const Icon = result.success ? CheckCircle2 : XCircle;
  const errorKey = result.errorCode?.toLowerCase() ?? "unknown_error";
  return (
    <div
      className={cn(
        "rounded-md border p-4",
        result.success
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-destructive/40 bg-destructive/10"
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        <Icon className="size-4" />
        {result.success
          ? t("test.successTitle")
          : t(`test.errorCodes.${errorKey}`)}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {result.success ? t("test.successMessage") : t("test.failureMessage")} ({result.responseTimeMs} ms)
      </p>
      {result.agentVersion ? (
        <p className="mt-2 text-xs">
          {t("test.version")} {result.agentVersion} ·{" "}
          {result.capabilities.join(", ") || t("test.noCapabilities")}
        </p>
      ) : null}
    </div>
  );
}
function Troubleshooting({ code }: { code: string | null }) {
  const t = useTranslations("agents.setupWizard");
  const unauthorized = code === "UNAUTHORIZED";
  const invalid = code === "INVALID_RESPONSE";
  return (
    <Info title={t("troubleshooting.title")}>
      <ul className="list-disc space-y-1 pl-5">
        {unauthorized ? (
          <>
            <li>
              {t("troubleshooting.secretPrefix")} <code>/etc/kyvora/agent.secret</code>.
            </li>
            <li>{t("troubleshooting.restartAfterSecret")}</li>
          </>
        ) : invalid ? (
          <>
            <li>{t("troubleshooting.verifyUrl")}</li>
            <li>{t("troubleshooting.checkVersion")}</li>
          </>
        ) : (
          <>
            <li>
              {t("troubleshooting.checkPrefix")} <code>systemctl status kyvora-agent</code>.
            </li>
            <li>{t("troubleshooting.network")}</li>
            <li>{t("troubleshooting.route")}</li>
            <li>
              {t("troubleshooting.inspectPrefix")} <code>journalctl -u kyvora-agent -f</code>.
            </li>
          </>
        )}
      </ul>
    </Info>
  );
}
