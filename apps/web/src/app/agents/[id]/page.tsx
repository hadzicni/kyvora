"use client";

import { RefreshCw } from "lucide-react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { AppShell } from "@/components/app/app-shell";
import { DetailLayout } from "@/components/app/detail-layout";
import { PageHeader, PageHeaderBackLink } from "@/components/app/page-header";
import { InfoList, InfoRow, PageSection } from "@/components/app/page-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentStatusBadge } from "@/features/agents/agent-status-badge";
import { RemoveAgentDialog } from "@/features/agents/remove-agent-dialog";
import { AgentErrorState } from "@/features/agents/agent-error-state";
import { useAgent, usePullAgent } from "@/features/agents/use-agents";
import { formatBytes, formatDateTime, formatUptime } from "@/features/servers/format";
import { AgentApiError } from "@/lib/api/agents";
import { canRemoveAgents, canPullAgents } from "@/lib/permissions";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";

function getParamId(id: string | string[] | undefined) {
  return Array.isArray(id) ? id[0] : (id ?? "");
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
        <PageHeader
          actions={
            agent ? (
              <>
                {canPullAgents(session?.user.permissions) ? (
                  <Button
                    disabled={pullAgent.isPending}
                    onClick={() => void pullNow()}
                    type="button"
                    variant="outline"
                  >
                    <RefreshCw
                      className={cn("size-4", pullAgent.isPending && "animate-spin")}
                    />
                    Pull now
                  </Button>
                ) : null}
                {canRemoveAgents(session?.user.permissions) ? (
                  <RemoveAgentDialog agent={agent} redirectTo="/agents" />
                ) : null}
              </>
            ) : null
          }
          eyebrow={
            <PageHeaderBackLink href="/agents">Back to agents</PageHeaderBackLink>
          }
          badge={agent ? <AgentStatusBadge status={agent.status} /> : null}
          subtitle="Pull-based agent connection and latest collected host facts."
          title={agent?.name ?? (agentQuery.isLoading ? "Loading agent..." : "Agent")}
        />

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
          <DetailLayout
            aside={
              <>
                <PageSection title="Metrics">
                  <InfoList>
                    <InfoRow
                      label="CPU count"
                      value={agent.hostFacts?.cpuCount ?? "Unknown"}
                    />
                    <InfoRow
                      label="Memory"
                      value={formatBytes(agent.hostFacts?.memoryTotalBytes)}
                    />
                    <InfoRow
                      label="Disk total"
                      value={formatBytes(agent.hostFacts?.diskTotalBytes)}
                    />
                    <InfoRow
                      label="Disk free"
                      value={formatBytes(agent.hostFacts?.diskFreeBytes)}
                    />
                    <InfoRow
                      label="Uptime"
                      value={formatUptime(agent.hostFacts?.uptimeSeconds)}
                    />
                  </InfoList>
                </PageSection>

                <PageSection title="Network">
                  {(agent.hostFacts?.ipAddresses ?? []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {agent.hostFacts?.ipAddresses.map((address) => (
                        <span
                          className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground"
                          key={address}
                        >
                          {address}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No IP addresses reported.
                    </p>
                  )}
                </PageSection>

                <PageSection title="Capabilities">
                  {agent.capabilities.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.map((capability) => (
                        <span
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
                          key={capability}
                        >
                          {capability}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No capabilities reported yet.
                    </p>
                  )}
                </PageSection>
              </>
            }
          >
            <PageSection
              description="Kyvora pulls agent data over the configured secured HTTP endpoint."
              title="Connection"
            >
              <InfoList className="max-w-2xl">
                <InfoRow label="Base URL" mono value={agent.baseUrl} />
                <InfoRow
                  label="Pull enabled"
                  value={agent.pullEnabled ? "Enabled" : "Disabled"}
                />
                <InfoRow label="Agent version" mono value={agent.version} />
                <InfoRow label="Last pull" value={formatDateTime(agent.lastPullAt)} />
                <InfoRow
                  label="Last successful pull"
                  value={formatDateTime(agent.lastSuccessfulPullAt)}
                />
                <InfoRow label="Last seen" value={formatDateTime(agent.lastSeenAt)} />
                <InfoRow label="Last error" value={agent.lastPullError ?? "None"} />
              </InfoList>
            </PageSection>

            <PageSection
              description="Latest host facts collected from the agent."
              title="System"
            >
              <InfoList className="max-w-2xl">
                <InfoRow
                  label="Hostname"
                  mono
                  value={agent.hostFacts?.hostname ?? agent.hostname}
                />
                <InfoRow
                  label="Operating system"
                  value={agent.hostFacts?.operatingSystem ?? "Unknown"}
                />
                <InfoRow label="Platform" value={agent.hostFacts?.platform ?? "Unknown"} />
                <InfoRow
                  label="Architecture"
                  value={agent.hostFacts?.architecture ?? "Unknown"}
                />
                <InfoRow
                  label="Kernel"
                  mono
                  value={agent.hostFacts?.kernelVersion ?? "Unknown"}
                />
                <InfoRow
                  label="Collected at"
                  value={formatDateTime(agent.hostFacts?.collectedAt)}
                />
              </InfoList>
            </PageSection>
          </DetailLayout>
        ) : null}
      </div>
    </AppShell>
  );
}
