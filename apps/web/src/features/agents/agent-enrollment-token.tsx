"use client";

import { Check, Copy, Loader2, Terminal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/features/servers/format";
import type { AgentEnrollment } from "@/lib/api/agents";

import { useAgent, useCancelAgentEnrollment } from "./use-agents";

const defaultAgentApiUrl = "http://localhost:8080";
const agentPollIntervalMs = 3000;

export function isAgentConnected(
  agent: Pick<AgentEnrollment["agent"], "status" | "lastSeenAt">
) {
  return agent.status === "ONLINE" || agent.lastSeenAt !== null;
}

export function AgentEnrollmentToken({
  allowCancelEnrollment = true,
  enrollment,
  onClose,
  onConnectionChange,
}: {
  allowCancelEnrollment?: boolean;
  enrollment: AgentEnrollment;
  onConnectionChange?: (connected: boolean) => void;
  onClose: (mode: "connected" | "canceled") => void;
}) {
  const t = useTranslations();
  const [copied, setCopied] = useState<"token" | "command" | null>(null);
  const cancelEnrollment = useCancelAgentEnrollment();
  const agentQuery = useAgent(enrollment.agent.id, {
    enabled: !isAgentConnected(enrollment.agent),
    refetchInterval: (query) =>
      isAgentConnected(query.state.data ?? enrollment.agent)
        ? false
        : agentPollIntervalMs,
  });
  const { refetch } = agentQuery;
  const currentAgent = agentQuery.data ?? enrollment.agent;
  const connected = isAgentConnected(currentAgent);
  const lastSeenAt = currentAgent.lastSeenAt ?? enrollment.agent.lastSeenAt;

  useEffect(() => {
    if (connected) {
      return;
    }

    void refetch();
  }, [connected, refetch]);

  useEffect(() => {
    onConnectionChange?.(connected);
  }, [connected, onConnectionChange]);

  const runCommand = useMemo(
    () => `KYVORA_API_URL=${defaultAgentApiUrl} \\
KYVORA_AGENT_ID=${enrollment.agent.id} \\
KYVORA_AGENT_TOKEN=${enrollment.agentToken} \\
npm run dev:agent`,
    [enrollment.agent.id, enrollment.agentToken]
  );

  async function copyValue(kind: "token" | "command", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  async function confirmCancelEnrollment() {
    const confirmed = window.confirm(t("agents.cancelEnrollmentConfirm"));

    if (!confirmed) {
      return;
    }

    try {
      await cancelEnrollment.mutateAsync(enrollment.agent.id);
      toast.success(t("agents.enrollmentCanceledToast"), {
        description: enrollment.agent.name,
      });
      onClose("canceled");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("agents.cancelEnrollmentFailedDescription");
      toast.error(t("agents.cancelEnrollmentFailedToast"), {
        description: message,
      });
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        {t("agents.tokenShownOnceDescription")}
      </div>

      <TokenDetail label={t("agents.agentId")} value={enrollment.agent.id} />
      <TokenDetail label={t("agents.apiServerUrl")} value={defaultAgentApiUrl} />

      <div className="grid gap-2">
        <Label>{t("agents.agentToken")}</Label>
        <div className="flex min-w-0 gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs">
            {enrollment.agentToken}
          </code>
          <Button
            aria-label={t("agents.copyAgentToken")}
            size="icon"
            type="button"
            variant="outline"
            onClick={() => void copyValue("token", enrollment.agentToken)}
          >
            {copied === "token" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>{t("agents.runCommand")}</Label>
        <div className="rounded-md border bg-muted">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <Terminal className="size-4 text-muted-foreground" />
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => void copyValue("command", runCommand)}
            >
              {copied === "command" ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              {t("agents.copyCommand")}
            </Button>
          </div>
          <pre className="overflow-x-auto p-3 text-xs">
            <code>{runCommand}</code>
          </pre>
        </div>
      </div>

      {connected ? (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <Check className="size-4" />
            {t("agents.connected")}
          </div>
          <div className="mt-1 text-xs text-emerald-100/80">
            {t("agents.lastSeenAt", { date: formatDateTime(lastSeenAt) })}
          </div>
        </div>
      ) : (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            {t("agents.waitingForConnection")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("agents.runCommandHint")}
          </p>
        </div>
      )}

      <DialogFooter className="sm:justify-between">
        {allowCancelEnrollment ? (
          <Button
            type="button"
            variant="outline"
            disabled={cancelEnrollment.isPending}
            onClick={() => void confirmCancelEnrollment()}
          >
            {cancelEnrollment.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            {t("agents.cancelEnrollment")}
          </Button>
        ) : (
          <div />
        )}
        <Button
          type="button"
          disabled={!connected}
          onClick={() => onClose("connected")}
        >
          {t("actions.close")}
        </Button>
      </DialogFooter>
    </div>
  );
}

function TokenDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <code className="overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs">
        {value}
      </code>
    </div>
  );
}
