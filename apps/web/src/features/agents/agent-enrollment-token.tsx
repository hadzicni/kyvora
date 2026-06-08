"use client";

import { Check, Copy, Loader2, Terminal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
    const confirmed = window.confirm(
      "This will revoke the token and remove the pending agent. You can enroll a new agent later."
    );

    if (!confirmed) {
      return;
    }

    try {
      await cancelEnrollment.mutateAsync(enrollment.agent.id);
      toast.success("Enrollment canceled.", {
        description: enrollment.agent.name,
      });
      onClose("canceled");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to cancel enrollment right now.";
      toast.error("Unable to cancel enrollment.", {
        description: message,
      });
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        This token is shown only once. Store it securely before closing this
        dialog.
      </div>

      <TokenDetail label="Agent ID" value={enrollment.agent.id} />
      <TokenDetail label="API Server URL" value={defaultAgentApiUrl} />

      <div className="grid gap-2">
        <Label>Agent Token</Label>
        <div className="flex min-w-0 gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs">
            {enrollment.agentToken}
          </code>
          <Button
            aria-label="Copy agent token"
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
        <Label>Run command</Label>
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
              Copy command
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
            Agent connected
          </div>
          <div className="mt-1 text-xs text-emerald-100/80">
            Last seen {formatDateTime(lastSeenAt)}
          </div>
        </div>
      ) : (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
            Waiting for agent to connect...
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Run the copied command with the one-time token. This dialog will
            unlock after the first successful heartbeat.
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
            Cancel enrollment
          </Button>
        ) : (
          <div />
        )}
        <Button
          type="button"
          disabled={!connected}
          onClick={() => onClose("connected")}
        >
          Done
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
