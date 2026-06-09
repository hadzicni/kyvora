"use client";

import {
  ArrowLeft,
  Bot,
  Cpu,
  Fingerprint,
  HardDrive,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentEnrollmentToken } from "@/features/agents/agent-enrollment-token";
import { AgentErrorState } from "@/features/agents/agent-error-state";
import { AgentStatusBadge } from "@/features/agents/agent-status-badge";
import { DecommissionAgentDialog } from "@/features/agents/decommission-agent-dialog";
import {
  useAgent,
  useCancelAgentEnrollment,
  useRotateAgentToken,
} from "@/features/agents/use-agents";
import {
  formatBytes,
  formatDateTime,
  formatUptime,
} from "@/features/servers/format";
import { AgentApiError, type Agent, type AgentEnrollment } from "@/lib/api/agents";
import { cn } from "@/lib/utils";

function getParamId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : (id ?? "");
}

function Field({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3">
      <dt className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-2 min-h-5 break-words text-sm text-foreground",
          mono && "font-mono text-xs",
          muted && "text-muted-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DetailSection({
  children,
  description,
  icon,
  title,
}: {
  children: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <dl className="grid gap-3">{children}</dl>
      </CardContent>
    </Card>
  );
}

function operationalCopy(agent: Agent) {
  switch (agent.status) {
    case "ONLINE":
      return "Agent is reporting heartbeats.";
    case "OFFLINE":
      return "No heartbeat has been received recently.";
    case "PENDING":
      return "Waiting for first heartbeat.";
    case "DECOMMISSIONED":
      return "Agent has been decommissioned and cannot heartbeat.";
    case "UNKNOWN":
      return "Agent status is unknown.";
  }
}

function HostFactsSection({ agent }: { agent: Agent }) {
  const facts = agent.hostFacts;

  if (!facts) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cpu className="size-4 text-muted-foreground" />
            Host facts
          </CardTitle>
          <CardDescription>Latest inventory snapshot from the agent.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="rounded-md border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
            Host facts will appear after the agent sends its first heartbeat.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DetailSection
      title="Host facts"
      description="Latest inventory snapshot from the agent."
      icon={<Cpu className="size-4 text-muted-foreground" />}
    >
      <Field label="OS" value={facts.operatingSystem ?? "Unknown"} muted={!facts.operatingSystem} />
      <Field label="Platform" value={facts.platform ?? "Unknown"} muted={!facts.platform} />
      <Field label="Kernel version" value={facts.kernelVersion ?? "Unknown"} muted={!facts.kernelVersion} mono />
      <Field label="Architecture" value={facts.architecture ?? "Unknown"} muted={!facts.architecture} mono />
      <Field label="CPU count" value={facts.cpuCount ?? "Unknown"} muted={facts.cpuCount === null} />
      <Field label="Memory total" value={formatBytes(facts.memoryTotalBytes)} muted={facts.memoryTotalBytes === null} />
      <Field
        label="Disk"
        value={`${formatBytes(facts.diskFreeBytes)} free / ${formatBytes(facts.diskTotalBytes)} total`}
        muted={facts.diskFreeBytes === null && facts.diskTotalBytes === null}
      />
      <Field label="Uptime" value={formatUptime(facts.uptimeSeconds)} muted={facts.uptimeSeconds === null} />
      <Field
        label="IP addresses"
        value={facts.ipAddresses.length > 0 ? facts.ipAddresses.join(", ") : "Unknown"}
        muted={facts.ipAddresses.length === 0}
        mono
      />
      <Field label="Agent version" value={facts.agentVersion ?? "Unknown"} muted={!facts.agentVersion} mono />
      <Field label="Collected at" value={formatDateTime(facts.collectedAt)} muted={!facts.collectedAt} />
    </DetailSection>
  );
}

function AgentActions({
  agent,
  onCancelEnrollment,
  onRotateToken,
}: {
  agent: Agent;
  onCancelEnrollment: () => void;
  onRotateToken: () => void;
}) {
  const pending = agent.status === "PENDING" && agent.lastSeenAt === null;
  const connected = agent.status === "ONLINE" || agent.status === "OFFLINE";

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {agent.status !== "DECOMMISSIONED" ? (
        <Button type="button" variant={pending ? "default" : "outline"} onClick={onRotateToken}>
          <Terminal className="size-4" />
          {pending ? "Generate setup token" : "Rotate token"}
        </Button>
      ) : null}
      {pending ? (
        <Button type="button" variant="outline" onClick={onCancelEnrollment}>
          Cancel enrollment
        </Button>
      ) : null}
      {connected ? <DecommissionAgentDialog agent={agent} /> : null}
    </div>
  );
}

function TokenLifecycleSection({
  agent,
  onCancelEnrollment,
  onRotateToken,
}: {
  agent: Agent;
  onCancelEnrollment: () => void;
  onRotateToken: () => void;
}) {
  const pending = agent.status === "PENDING" && agent.lastSeenAt === null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-muted-foreground" />
          Token / setup lifecycle
        </CardTitle>
        <CardDescription>
          Tokens are shown once and stored only as hashes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {pending ? (
          <div className="rounded-md border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
            Start the agent with `KYVORA_AGENT_ID` and the one-time token from a
            generated setup command. Rotate token to generate a new one-time
            token.
          </div>
        ) : null}
        {agent.status === "DECOMMISSIONED" ? (
          <div className="rounded-md border border-zinc-500/30 bg-zinc-500/10 p-3 text-sm text-zinc-200">
            This agent is not active. Its token has been revoked and it cannot
            send heartbeats.
          </div>
        ) : null}
        <dl className="grid gap-3">
          <Field label="Token created" value={formatDateTime(agent.tokenCreatedAt)} muted={!agent.tokenCreatedAt} />
          <Field label="Token last used" value={formatDateTime(agent.tokenLastUsedAt)} muted={!agent.tokenLastUsedAt} />
          <Field label="Token revoked" value={formatDateTime(agent.tokenRevokedAt)} muted={!agent.tokenRevokedAt} />
        </dl>
        <AgentActions
          agent={agent}
          onCancelEnrollment={onCancelEnrollment}
          onRotateToken={onRotateToken}
        />
      </CardContent>
    </Card>
  );
}

function AgentDetail({ agent }: { agent: Agent }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<AgentEnrollment | null>(null);
  const [agentConnected, setAgentConnected] = useState(false);
  const rotateAgentToken = useRotateAgentToken();
  const cancelAgentEnrollment = useCancelAgentEnrollment();
  const pending = agent.status === "PENDING" && agent.lastSeenAt === null;

  const handleAgentConnectionChange = useCallback((connected: boolean) => {
    setAgentConnected(connected);
  }, []);

  async function rotateToken() {
    try {
      const rotated = await rotateAgentToken.mutateAsync(agent.id);
      setAgentConnected(false);
      setEnrollment(rotated);
      toast.success("Agent token rotated.", {
        description: rotated.agent.name,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to rotate the agent token right now.";
      toast.error("Unable to rotate token.", {
        description: message,
      });
    }
  }

  async function cancelEnrollment() {
    const confirmed = window.confirm(
      "This will revoke the token and remove the pending agent. You can enroll a new agent later."
    );
    if (!confirmed) {
      return;
    }

    try {
      await cancelAgentEnrollment.mutateAsync(agent.id);
      toast.success("Enrollment canceled.", {
        description: agent.name,
      });
      router.push("/agents");
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

  function closeTokenDialog() {
    setEnrollment(null);
    setAgentConnected(false);
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="size-4" />
                  Agent registry record
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="break-words text-3xl font-semibold tracking-tight">
                    {agent.name}
                  </h1>
                  <AgentStatusBadge status={agent.status} />
                </div>
                <CardDescription className="break-words font-mono text-xs">
                  {agent.hostname}
                  {agent.serverId ? (
                    <>
                      {" / "}
                      <Link
                        className="underline-offset-4 hover:text-foreground hover:underline"
                        href={`/servers/${agent.serverId}`}
                      >
                        {agent.serverName ?? agent.serverHostname ?? agent.serverId}
                      </Link>
                    </>
                  ) : null}
                </CardDescription>
              </div>
              <AgentActions
                agent={agent}
                onCancelEnrollment={() => void cancelEnrollment()}
                onRotateToken={() => void rotateToken()}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {operationalCopy(agent)}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <DetailSection
            title="Agent identity"
            description="Registration, heartbeat, and lifecycle details."
            icon={<Fingerprint className="size-4 text-muted-foreground" />}
          >
            <Field label="Agent ID" value={agent.id} mono />
            <Field label="Name" value={agent.name} />
            <Field label="Hostname" value={agent.hostname} mono />
            <Field label="Version" value={agent.version} mono />
            <Field label="Status" value={<AgentStatusBadge status={agent.status} />} />
            <Field label="Registered" value={formatDateTime(agent.registeredAt)} />
            <Field label="Last seen" value={formatDateTime(agent.lastSeenAt)} muted={!agent.lastSeenAt} />
            <Field label="Updated" value={formatDateTime(agent.updatedAt)} />
          </DetailSection>

          <DetailSection
            title="Linked server"
            description="Current active server assignment."
            icon={<Server className="size-4 text-muted-foreground" />}
          >
            {agent.serverId ? (
              <>
                <Field label="Server name" value={agent.serverName ?? "Unknown"} muted={!agent.serverName} />
                <Field label="Server hostname" value={agent.serverHostname ?? "Unknown"} muted={!agent.serverHostname} mono />
                <Field
                  label="Server link"
                  value={
                    <Link
                      className="underline-offset-4 hover:text-foreground hover:underline"
                      href={`/servers/${agent.serverId}`}
                    >
                      View linked server
                    </Link>
                  }
                />
              </>
            ) : (
              <Field label="Assignment" value="No active server assignment" muted />
            )}
          </DetailSection>

          <HostFactsSection agent={agent} />

          <TokenLifecycleSection
            agent={agent}
            onCancelEnrollment={() => void cancelEnrollment()}
            onRotateToken={() => void rotateToken()}
          />

          <DetailSection
            title="Operational state"
            description="Current heartbeat state and troubleshooting hint."
            icon={<Network className="size-4 text-muted-foreground" />}
          >
            <Field label="State" value={operationalCopy(agent)} />
            <Field label="Last heartbeat" value={formatDateTime(agent.lastSeenAt)} muted={!agent.lastSeenAt} />
            <Field label="Host facts" value={agent.hostFacts ? "Available" : "Not reported yet"} muted={!agent.hostFacts} />
          </DetailSection>

          <DetailSection
            title="Storage"
            description="Disk and memory facts from the latest host snapshot."
            icon={<HardDrive className="size-4 text-muted-foreground" />}
          >
            <Field label="Memory total" value={formatBytes(agent.hostFacts?.memoryTotalBytes)} muted={!agent.hostFacts?.memoryTotalBytes} />
            <Field label="Disk total" value={formatBytes(agent.hostFacts?.diskTotalBytes)} muted={!agent.hostFacts?.diskTotalBytes} />
            <Field label="Disk free" value={formatBytes(agent.hostFacts?.diskFreeBytes)} muted={!agent.hostFacts?.diskFreeBytes} />
          </DetailSection>
        </div>
      </div>

      <Dialog
        open={Boolean(enrollment)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && enrollment && !agentConnected) {
            return;
          }
          if (!nextOpen) {
            closeTokenDialog();
          }
        }}
      >
        <DialogContent
          className="sm:max-w-2xl"
          showCloseButton={!enrollment || agentConnected}
          onEscapeKeyDown={(event) => {
            if (enrollment && !agentConnected) {
              event.preventDefault();
            }
          }}
          onPointerDownOutside={(event) => {
            if (enrollment && !agentConnected) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Agent token</DialogTitle>
            <DialogDescription>This token is shown only once.</DialogDescription>
          </DialogHeader>
          {enrollment ? (
            <AgentEnrollmentToken
              allowCancelEnrollment={pending}
              enrollment={enrollment}
              onClose={closeTokenDialog}
              onConnectionChange={handleAgentConnectionChange}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AgentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardHeader>
        <CardContent className="pt-4">
          <Skeleton className="h-5 w-80 max-w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="border-b">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="grid gap-3 pt-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
        <Bot className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium">Agent not found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This agent does not exist or may have been removed before it connected.
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link href="/agents">Back to Agents</Link>
      </Button>
    </div>
  );
}

export default function AgentDetailPage() {
  const params = useParams<{ id?: string | string[] }>();
  const id = getParamId(params.id);
  const agentQuery = useAgent(id);
  const isNotFound =
    agentQuery.error instanceof AgentApiError && agentQuery.error.status === 404;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild className="-ml-2 mb-2" size="sm" variant="ghost">
              <Link href="/agents">
                <ArrowLeft className="size-4" />
                Agents
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">
              Agent detail
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Full agent record from /api/v1/agents/{id || "[id]"}.
            </p>
          </div>
          <Button
            disabled={agentQuery.isFetching}
            onClick={() => void agentQuery.refetch()}
            variant="outline"
          >
            <RefreshCw
              className={cn("size-4", agentQuery.isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        {agentQuery.isLoading ? <AgentDetailSkeleton /> : null}
        {agentQuery.isError && isNotFound ? <NotFoundState /> : null}
        {agentQuery.isError && !isNotFound ? (
          <AgentErrorState
            message={
              agentQuery.error instanceof Error
                ? agentQuery.error.message
                : "The agent management API returned an unexpected error."
            }
            onRetry={() => void agentQuery.refetch()}
          />
        ) : null}
        {agentQuery.isSuccess ? <AgentDetail agent={agentQuery.data} /> : null}
      </div>
    </AppShell>
  );
}
