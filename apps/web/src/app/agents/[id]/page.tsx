"use client";

import { ArrowLeft, Bot, Cpu, HardDrive, Network, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentStatusBadge } from "@/features/agents/agent-status-badge";
import { DecommissionAgentDialog } from "@/features/agents/decommission-agent-dialog";
import { AgentErrorState } from "@/features/agents/agent-error-state";
import { useAgent, usePullAgent } from "@/features/agents/use-agents";
import { formatBytes, formatDateTime, formatUptime } from "@/features/servers/format";
import { AgentApiError } from "@/lib/api/agents";
import { canDecommissionAgents, canPullAgents } from "@/lib/permissions";
import { toast } from "@/lib/toast";
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
    <div className="rounded-md border bg-muted/20 p-3">
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

export default function AgentDetailPage() {
  const params = useParams();
  const id = getParamId(params.id);
  const { data: session } = useSession();
  const agentQuery = useAgent(id);
  const pullAgent = usePullAgent();
  const agent = agentQuery.data;

  async function pullNow() {
    if (!agent) {
      return;
    }

    try {
      const result = await pullAgent.mutateAsync(agent.id);
      if (result.error) {
        toast.warning("Agent pull failed.", { description: result.error });
        return;
      }
      toast.success("Agent pull succeeded.", { description: result.agent.name });
    } catch (error) {
      toast.error("Agent pull failed.", {
        description: error instanceof Error ? error.message : "Unable to pull agent data.",
      });
    }
  }

  const notFound =
    agentQuery.error instanceof AgentApiError && agentQuery.error.status === 404;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <Button asChild variant="ghost" size="sm" className="w-fit">
              <Link href="/agents">
                <ArrowLeft className="size-4" />
                Back to agents
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-md border bg-muted/30">
                <Bot className="size-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-normal">
                  {agent?.name ?? (agentQuery.isLoading ? "Loading agent..." : "Agent")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Pull-based agent connection and latest collected host facts.
                </p>
              </div>
            </div>
          </div>
          {agent ? (
            <div className="flex gap-2">
              {canPullAgents(session?.user.permissions) ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pullAgent.isPending}
                  onClick={() => void pullNow()}
                >
                  <RefreshCw className={cn("size-4", pullAgent.isPending && "animate-spin")} />
                  Pull now
                </Button>
              ) : null}
              {canDecommissionAgents(session?.user.permissions) ? (
                <DecommissionAgentDialog agent={agent} />
              ) : null}
            </div>
          ) : null}
        </div>

        {agentQuery.isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : null}

        {agentQuery.isError ? (
          <AgentErrorState
            message={notFound ? "Agent not found." : "Unable to load agent."}
            onRetry={() => void agentQuery.refetch()}
          />
        ) : null}

        {agent ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle>Connection</CardTitle>
                  <CardDescription>
                    Kyvora pulls agent data over the configured secured HTTP endpoint.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
                  <Field label="Status" value={<AgentStatusBadge status={agent.status} />} />
                  <Field label="Base URL" value={agent.baseUrl} mono />
                  <Field label="Pull enabled" value={agent.pullEnabled ? "Enabled" : "Disabled"} />
                  <Field label="Agent version" value={agent.version} mono />
                  <Field label="Last pull" value={formatDateTime(agent.lastPullAt)} muted={!agent.lastPullAt} />
                  <Field label="Last successful pull" value={formatDateTime(agent.lastSuccessfulPullAt)} muted={!agent.lastSuccessfulPullAt} />
                  <Field label="Last seen" value={formatDateTime(agent.lastSeenAt)} muted={!agent.lastSeenAt} />
                  <Field label="Last error" value={agent.lastPullError ?? "None"} muted={!agent.lastPullError} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle>System</CardTitle>
                  <CardDescription>Latest host facts collected from the agent.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
                  <Field label="Hostname" value={agent.hostFacts?.hostname ?? agent.hostname} mono />
                  <Field label="Operating system" value={agent.hostFacts?.operatingSystem ?? "Unknown"} />
                  <Field label="Platform" value={agent.hostFacts?.platform ?? "Unknown"} />
                  <Field label="Architecture" value={agent.hostFacts?.architecture ?? "Unknown"} />
                  <Field label="Kernel" value={agent.hostFacts?.kernelVersion ?? "Unknown"} mono muted={!agent.hostFacts?.kernelVersion} />
                  <Field label="Collected at" value={formatDateTime(agent.hostFacts?.collectedAt)} muted={!agent.hostFacts?.collectedAt} />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="size-4" />
                    Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4">
                  <Field label="CPU count" value={agent.hostFacts?.cpuCount ?? "Unknown"} />
                  <Field label="Memory" value={formatBytes(agent.hostFacts?.memoryTotalBytes)} muted={!agent.hostFacts?.memoryTotalBytes} />
                  <Field label="Disk total" value={formatBytes(agent.hostFacts?.diskTotalBytes)} muted={!agent.hostFacts?.diskTotalBytes} />
                  <Field label="Disk free" value={formatBytes(agent.hostFacts?.diskFreeBytes)} muted={!agent.hostFacts?.diskFreeBytes} />
                  <Field label="Uptime" value={formatUptime(agent.hostFacts?.uptimeSeconds)} muted={!agent.hostFacts?.uptimeSeconds} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Network className="size-4" />
                    Network
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 pt-4">
                  {(agent.hostFacts?.ipAddresses ?? []).length > 0 ? (
                    agent.hostFacts?.ipAddresses.map((address) => (
                      <div key={address} className="rounded-md border bg-muted/20 px-3 py-2 font-mono text-xs">
                        {address}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No IP addresses reported.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="size-4" />
                    Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-4">
                  {agent.capabilities.length > 0 ? (
                    agent.capabilities.map((capability) => (
                      <span key={capability} className="rounded-md border bg-muted/20 px-2 py-1 text-xs">
                        {capability}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No capabilities reported yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
