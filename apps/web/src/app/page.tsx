"use client"

import { AlertCircle, Bot, CheckCircle2, Radio, Server, WifiOff } from "lucide-react"
import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"

import { AppShell } from "@/components/app/app-shell"
import { HealthBar, type HealthSegment } from "@/components/app/health-bar"
import { PageHeader } from "@/components/app/page-header"
import { SectionCard } from "@/components/app/section-card"
import { SectionState } from "@/components/app/section-state"
import { StatusBadge } from "@/components/app/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentEmptyState } from "@/features/agents/agent-empty-state"
import { AgentErrorState } from "@/features/agents/agent-error-state"
import { AgentStatusBadge } from "@/features/agents/agent-status-badge"
import { AgentTable } from "@/features/agents/agent-table"
import { useAgents } from "@/features/agents/use-agents"
import { RecentActivityWidget } from "@/features/audit-logs/recent-activity-widget"
import { useDashboardSummary } from "@/features/dashboard/use-dashboard-summary"
import { formatNumber } from "@/features/servers/format"
import { ServerEmptyState } from "@/features/servers/server-empty-state"
import { ServerErrorState } from "@/features/servers/server-error-state"
import { ServerStatusBadge } from "@/features/servers/server-status-badge"
import { ServerTable } from "@/features/servers/server-table"
import { useServers } from "@/features/servers/use-servers"
import { getInstanceSettings } from "@/lib/api/settings"
import { canDeleteServers, canUpdateServers } from "@/lib/permissions"
import { type Tone, toneClass } from "@/lib/tone"
import { cn } from "@/lib/utils"

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  description,
  icon: Icon,
  loading,
  title,
  tone,
  value,
}: {
  description: string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  title: string
  tone: Tone
  value: string
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-colors duration-200 hover:ring-foreground/20",
        toneClass(tone),
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full opacity-40 blur-2xl tone-fill"
      />
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0 space-y-1.5">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </div>
          )}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border tone-surface tone-text">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-3.5 w-36" />
        ) : (
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Health summary ───────────────────────────────────────────────────────────

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
  description: string
  empty: React.ReactNode
  error?: React.ReactNode
  items: React.ReactNode
  loading?: boolean
  segments: HealthSegment[]
  title: string
  total: number
}) {
  return (
    <SectionCard contentClassName="space-y-4 pt-4" description={description} title={title}>
      {loading ? (
        <>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-[4.5rem] w-full" />
            <Skeleton className="h-[4.5rem] w-full" />
            <Skeleton className="h-[4.5rem] w-full" />
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
    </SectionCard>
  )
}

function HealthMetric({
  count,
  helper,
  status,
}: {
  count: number
  helper: string
  status: React.ReactNode
}) {
  const locale = useLocale()

  return (
    <div className="rounded-lg border border-border bg-surface-subtle/40 p-3">
      <div className="flex items-center justify-between gap-2">
        {status}
        <span className="text-sm font-semibold tabular-nums">
          {formatNumber(count, locale)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { data: session } = useSession()
  const summaryQuery = useDashboardSummary()
  const serversQuery = useServers({ size: 20 })
  const agentsQuery = useAgents({ size: 20 })
  const instance = getInstanceSettings(undefined)

  const servers = serversQuery.data?.content ?? []
  const agents = agentsQuery.data?.content ?? []
  const summary = summaryQuery.data

  const totalServers = summary?.totalServers ?? 0
  const onlineCount = summary?.onlineServers ?? 0
  const offlineCount = summary?.offlineServers ?? 0
  const unknownCount = summary?.unknownServers ?? 0

  const totalAgents = agentsQuery.data?.totalElements ?? agents.length
  const onlineAgents = agents.filter((agent) => agent.status === "ONLINE").length
  const offlineAgents = agents.filter((agent) => agent.status === "OFFLINE").length
  const unknownAgents = agents.filter((agent) => agent.status === "UNKNOWN").length

  const attentionServers = offlineCount + unknownCount
  const attentionAgents = offlineAgents + unknownAgents

  const statusSegments = (
    online: number,
    offline: number,
    unknown: number,
  ): HealthSegment[] => [
    { label: t("statuses.ONLINE"), tone: "success", value: online },
    { label: t("statuses.OFFLINE"), tone: "danger", value: offline },
    { label: t("statuses.UNKNOWN"), tone: "warning", value: unknown },
  ]

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            <StatusBadge
              icon={<Radio />}
              tone={summaryQuery.isLoading ? "neutral" : "success"}
            >
              {summaryQuery.isLoading
                ? t("common.checking")
                : t("dashboard.liveOverview")}
            </StatusBadge>
          }
          subtitle={instance.description}
          title={instance.name}
        />

        {/* ── Stat cards ── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            description={t("dashboard.serversTracked")}
            icon={Server}
            loading={summaryQuery.isLoading}
            title={t("navigation.servers")}
            tone="info"
            value={formatNumber(totalServers, locale)}
          />
          <StatCard
            description={t("dashboard.serversOnline")}
            icon={CheckCircle2}
            loading={summaryQuery.isLoading}
            title={t("dashboard.onlineServers")}
            tone="success"
            value={formatNumber(onlineCount, locale)}
          />
          <StatCard
            description={t("dashboard.needsAttentionDescription")}
            icon={WifiOff}
            loading={summaryQuery.isLoading}
            title={t("dashboard.needsAttention")}
            tone={attentionServers > 0 ? "danger" : "neutral"}
            value={formatNumber(attentionServers, locale)}
          />
          <StatCard
            description={t("dashboard.registeredAgentsDescription")}
            icon={Bot}
            loading={agentsQuery.isLoading}
            title={t("navigation.agents")}
            tone="brand"
            value={formatNumber(totalAgents, locale)}
          />
        </div>

        {/* ── Health summaries ── */}
        <div className="grid gap-4 xl:grid-cols-2">
          <HealthSummary
            description={
              summary?.generatedAt
                ? t("dashboard.generatedAt", {
                    date: new Date(summary.generatedAt).toLocaleString(locale),
                  })
                : t("dashboard.inventoryHealth")
            }
            empty={<ServerEmptyState />}
            error={
              summaryQuery.isError ? (
                <ServerErrorState
                  message={
                    summaryQuery.error instanceof Error
                      ? summaryQuery.error.message
                      : t("errors.unexpected")
                  }
                  onRetry={() => void summaryQuery.refetch()}
                />
              ) : undefined
            }
            items={
              <>
                <HealthMetric
                  count={onlineCount}
                  helper={t("dashboard.acceptingHeartbeats")}
                  status={<ServerStatusBadge status="ONLINE" />}
                />
                <HealthMetric
                  count={offlineCount}
                  helper={t("dashboard.noRecentHeartbeat")}
                  status={<ServerStatusBadge status="OFFLINE" />}
                />
                <HealthMetric
                  count={unknownCount}
                  helper={t("dashboard.noClearState")}
                  status={<ServerStatusBadge status="UNKNOWN" />}
                />
              </>
            }
            loading={summaryQuery.isLoading}
            segments={statusSegments(onlineCount, offlineCount, unknownCount)}
            title={t("dashboard.serverHealth")}
            total={totalServers}
          />

          <HealthSummary
            description={t("dashboard.agentHealthDescription")}
            empty={<AgentEmptyState />}
            error={
              agentsQuery.isError ? (
                <AgentErrorState
                  message={
                    agentsQuery.error instanceof Error
                      ? agentsQuery.error.message
                      : t("agents.unexpectedError")
                  }
                  onRetry={() => void agentsQuery.refetch()}
                />
              ) : undefined
            }
            items={
              <>
                <HealthMetric
                  count={onlineAgents}
                  helper={t("dashboard.agentsReporting")}
                  status={<AgentStatusBadge status="ONLINE" />}
                />
                <HealthMetric
                  count={offlineAgents}
                  helper={t("dashboard.agentsMissing")}
                  status={<AgentStatusBadge status="OFFLINE" />}
                />
                <HealthMetric
                  count={unknownAgents}
                  helper={t("dashboard.pendingUnknownAgents")}
                  status={<AgentStatusBadge status="UNKNOWN" />}
                />
              </>
            }
            loading={agentsQuery.isLoading}
            segments={statusSegments(onlineAgents, offlineAgents, unknownAgents)}
            title={t("dashboard.agentHealth")}
            total={totalAgents}
          />
        </div>

        {/* ── Attention banner ── */}
        {attentionServers > 0 || attentionAgents > 0 ? (
          <div className="tone-warning flex items-start gap-3 rounded-xl border tone-surface p-4 tone-text">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {t("dashboard.operationalAttention")}
              </p>
              <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                {t("dashboard.attentionSummary", {
                  agents: formatNumber(attentionAgents, locale),
                  servers: formatNumber(attentionServers, locale),
                })}
              </p>
            </div>
          </div>
        ) : null}

        {/* ── Recent servers + agents ── */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <SectionCard
            description={t("dashboard.recentServersDescription")}
            icon={<Server />}
            title={t("dashboard.recentServers")}
          >
            {serversQuery.isLoading ? <Skeleton className="h-64 w-full" /> : null}
            {serversQuery.isError ? (
              <ServerErrorState
                message={
                  serversQuery.error instanceof Error
                    ? serversQuery.error.message
                    : t("servers.unexpectedError")
                }
                onRetry={() => void serversQuery.refetch()}
              />
            ) : null}
            {serversQuery.isSuccess && servers.length === 0 ? <ServerEmptyState /> : null}
            {serversQuery.isSuccess && servers.length > 0 ? (
              <ServerTable
                canDelete={canDeleteServers(session?.user.permissions)}
                canEdit={canUpdateServers(session?.user.permissions)}
                servers={servers.slice(0, 5)}
              />
            ) : null}
          </SectionCard>

          <SectionCard
            description={t("dashboard.recentAgentsDescription")}
            icon={<Bot />}
            title={t("dashboard.recentAgents")}
          >
            {agentsQuery.isLoading ? <Skeleton className="h-64 w-full" /> : null}
            {agentsQuery.isError ? (
              <AgentErrorState
                message={
                  agentsQuery.error instanceof Error
                    ? agentsQuery.error.message
                    : t("agents.unexpectedError")
                }
                onRetry={() => void agentsQuery.refetch()}
              />
            ) : null}
            {agentsQuery.isSuccess && agents.length === 0 ? (
              <SectionState
                description={t("dashboard.noAgentsEnrolledDescription")}
                icon={<Bot className="size-5" />}
                size="sm"
                title={t("dashboard.noAgentsEnrolled")}
              />
            ) : null}
            {agentsQuery.isSuccess && agents.length > 0 ? (
              <AgentTable agents={agents.slice(0, 5)} compact />
            ) : null}
          </SectionCard>
        </div>

        <RecentActivityWidget />
      </div>
    </AppShell>
  )
}
