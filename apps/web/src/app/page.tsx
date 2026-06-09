"use client";

import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Radio,
  Server,
  WifiOff,
} from "lucide-react";
import { useSession } from "next-auth/react";

import { AppShell } from "@/components/app/app-shell";
import { HealthBar, type HealthSegment } from "@/components/app/health-bar";
import { PageHeader } from "@/components/app/page-header";
import { SectionState } from "@/components/app/section-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentEmptyState } from "@/features/agents/agent-empty-state";
import { AgentErrorState } from "@/features/agents/agent-error-state";
import { AgentStatusBadge } from "@/features/agents/agent-status-badge";
import { AgentTable } from "@/features/agents/agent-table";
import { useAgents } from "@/features/agents/use-agents";
import { RecentActivityWidget } from "@/features/audit-logs/recent-activity-widget";
import { useDashboardSummary } from "@/features/dashboard/use-dashboard-summary";
import { formatNumber } from "@/features/servers/format";
import { ServerEmptyState } from "@/features/servers/server-empty-state";
import { ServerErrorState } from "@/features/servers/server-error-state";
import { ServerStatusBadge } from "@/features/servers/server-status-badge";
import { ServerTable } from "@/features/servers/server-table";
import { useServers } from "@/features/servers/use-servers";
import { getInstanceSettings } from "@/lib/api/settings";
import { canDeleteServers, canManageServers } from "@/lib/permissions";

function StatCard({
  accentClassName,
  description,
  icon: Icon,
  loading,
  title,
  value,
}: {
  accentClassName: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  title: string;
  value: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-semibold">{value}</div>
          )}
        </div>
        <div className={`rounded-md p-2 ${accentClassName}`}>
          <Icon className="size-4" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-4 w-36" />
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HealthSummary({
  description,
  empty,
  error,
  items,
  loading,
  segments,
  title,
  total,
}: {
  description: string;
  empty: React.ReactNode;
  error?: React.ReactNode;
  items: React.ReactNode;
  loading?: boolean;
  segments: HealthSegment[];
  title: string;
  total: number;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <>
            <Skeleton className="h-2 w-full" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </>
        ) : error ? (
          error
        ) : total === 0 ? (
          empty
        ) : (
          <>
            <HealthBar segments={segments} total={total} />
            <div className="grid gap-3 sm:grid-cols-3">{items}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HealthMetric({
  count,
  helper,
  status,
}: {
  count: number;
  helper: string;
  status: React.ReactNode;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        {status}
        <span className="text-sm font-semibold">{formatNumber(count)}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  );
}

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const summaryQuery = useDashboardSummary();
  const serversQuery = useServers({ size: 20 });
  const agentsQuery = useAgents({ size: 20 });
  const instance = getInstanceSettings(undefined);
  const servers = serversQuery.data?.content ?? [];
  const agents = agentsQuery.data?.content ?? [];
  const summary = summaryQuery.data;
  const totalServers = summary?.totalServers ?? 0;
  const onlineCount = summary?.onlineServers ?? 0;
  const offlineCount = summary?.offlineServers ?? 0;
  const unknownCount = summary?.unknownServers ?? 0;
  const totalAgents = agentsQuery.data?.totalElements ?? agents.length;
  const onlineAgents = agents.filter((agent) => agent.status === "ONLINE").length;
  const offlineAgents = agents.filter((agent) => agent.status === "OFFLINE").length;
  const pendingAgents = agents.filter((agent) => agent.status === "PENDING").length;
  const unknownAgents = agents.filter((agent) => agent.status === "UNKNOWN").length;
  const attentionServers = offlineCount + unknownCount;
  const attentionAgents = offlineAgents + pendingAgents + unknownAgents;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            <Badge className="w-fit" variant="outline">
              <Radio className="size-3" />
              {summaryQuery.isLoading ? "Checking" : "Live overview"}
            </Badge>
          }
          subtitle={instance.description}
          title={instance.name}
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            accentClassName="bg-sky-500/10 text-sky-300"
            description="Servers tracked in inventory."
            icon={Server}
            loading={summaryQuery.isLoading}
            title="Servers"
            value={formatNumber(totalServers)}
          />
          <StatCard
            accentClassName="bg-emerald-500/10 text-emerald-300"
            description="Servers currently reporting online."
            icon={CheckCircle2}
            loading={summaryQuery.isLoading}
            title="Online servers"
            value={formatNumber(onlineCount)}
          />
          <StatCard
            accentClassName={
              attentionServers > 0
                ? "bg-red-500/10 text-red-300"
                : "bg-muted text-muted-foreground"
            }
            description="Offline or unknown server records."
            icon={WifiOff}
            loading={summaryQuery.isLoading}
            title="Needs attention"
            value={formatNumber(attentionServers)}
          />
          <StatCard
            accentClassName="bg-violet-500/10 text-violet-300"
            description="Registered agents returned by the API."
            icon={Bot}
            loading={agentsQuery.isLoading}
            title="Agents"
            value={formatNumber(totalAgents)}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <HealthSummary
            description={
              summary?.generatedAt
                ? `Generated ${new Date(summary.generatedAt).toLocaleString()}`
                : "Inventory health at a glance."
            }
            empty={<ServerEmptyState />}
            error={
              summaryQuery.isError ? (
              <ServerErrorState
                message={
                  summaryQuery.error instanceof Error
                    ? summaryQuery.error.message
                    : "The dashboard API returned an unexpected error."
                }
                onRetry={() => void summaryQuery.refetch()}
              />
              ) : undefined
            }
            items={
              <>
                <HealthMetric
                  count={onlineCount}
                  helper="Accepting recent heartbeats."
                  status={<ServerStatusBadge status="ONLINE" />}
                />
                <HealthMetric
                  count={offlineCount}
                  helper="No recent heartbeat detected."
                  status={<ServerStatusBadge status="OFFLINE" />}
                />
                <HealthMetric
                  count={unknownCount}
                  helper="No clear operating state yet."
                  status={<ServerStatusBadge status="UNKNOWN" />}
                />
              </>
            }
            loading={summaryQuery.isLoading}
            segments={[
              {
                className: "bg-emerald-500",
                label: "Online",
                value: onlineCount,
              },
              { className: "bg-red-500", label: "Offline", value: offlineCount },
              {
                className: "bg-amber-500",
                label: "Unknown",
                value: unknownCount,
              },
            ]}
            title="Server health"
            total={totalServers}
          />

          <HealthSummary
            description="Agent lifecycle and heartbeat status."
            empty={<AgentEmptyState />}
            error={
              agentsQuery.isError ? (
              <AgentErrorState
                message={
                  agentsQuery.error instanceof Error
                    ? agentsQuery.error.message
                    : "The agent management API returned an unexpected error."
                }
                onRetry={() => void agentsQuery.refetch()}
              />
              ) : undefined
            }
            items={
              <>
                <HealthMetric
                  count={onlineAgents}
                  helper="Agents reporting heartbeats."
                  status={<AgentStatusBadge status="ONLINE" />}
                />
                <HealthMetric
                  count={offlineAgents}
                  helper="Agents missing heartbeats."
                  status={<AgentStatusBadge status="OFFLINE" />}
                />
                <HealthMetric
                  count={pendingAgents + unknownAgents}
                  helper="Pending or unknown lifecycle state."
                  status={<AgentStatusBadge status="PENDING" />}
                />
              </>
            }
            loading={agentsQuery.isLoading}
            segments={[
              {
                className: "bg-emerald-500",
                label: "Online",
                value: onlineAgents,
              },
              { className: "bg-red-500", label: "Offline", value: offlineAgents },
              {
                className: "bg-amber-500",
                label: "Pending",
                value: pendingAgents + unknownAgents,
              },
            ]}
            title="Agent health"
            total={totalAgents}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Server className="size-4" />
                Recent servers
              </CardTitle>
              <CardDescription>
                Latest server inventory records from the API.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {serversQuery.isLoading ? <Skeleton className="h-72 w-full" /> : null}
              {serversQuery.isError ? (
                <ServerErrorState
                  message={
                    serversQuery.error instanceof Error
                      ? serversQuery.error.message
                      : "The inventory API returned an unexpected error."
                  }
                  onRetry={() => void serversQuery.refetch()}
                />
              ) : null}
              {serversQuery.isSuccess && servers.length === 0 ? (
                <ServerEmptyState />
              ) : null}
              {serversQuery.isSuccess && servers.length > 0 ? (
                <ServerTable
                  canDelete={canDeleteServers(session?.user.role)}
                  canEdit={canManageServers(session?.user.role)}
                  servers={servers.slice(0, 5)}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="size-4" />
                Recent agents
              </CardTitle>
              <CardDescription>
                Agent records with heartbeat and version status.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {agentsQuery.isLoading ? <Skeleton className="h-72 w-full" /> : null}
              {agentsQuery.isError ? (
                <AgentErrorState
                  message={
                    agentsQuery.error instanceof Error
                      ? agentsQuery.error.message
                      : "The agent management API returned an unexpected error."
                  }
                  onRetry={() => void agentsQuery.refetch()}
                />
              ) : null}
              {agentsQuery.isSuccess && agents.length === 0 ? (
                <SectionState
                  description="Enroll an agent from a server detail page to begin collecting heartbeats and host facts."
                  icon={<Bot className="size-5" />}
                  title="No agents enrolled"
                />
              ) : null}
              {agentsQuery.isSuccess && agents.length > 0 ? (
                <AgentTable agents={agents.slice(0, 5)} compact />
              ) : null}
            </CardContent>
          </Card>
        </div>

        {attentionServers > 0 || attentionAgents > 0 ? (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
              <AlertCircle className="size-5 shrink-0 text-amber-300" />
              <div className="min-w-0">
                <div className="text-sm font-medium">Operational attention</div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {formatNumber(attentionServers)} server records and{" "}
                  {formatNumber(attentionAgents)} agent records are offline,
                  unknown, or pending.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <RecentActivityWidget />
      </div>
    </AppShell>
  );
}
