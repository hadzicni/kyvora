"use client"

import { AlertCircle, Bot, CheckCircle2, Radio, Server, WifiOff } from "lucide-react"
import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"

import { AppShell } from "@/components/app/app-shell"
import { HealthBar, type HealthSegment } from "@/components/app/health-bar"
import { PageHeader } from "@/components/app/page-header"
import { SectionState } from "@/components/app/section-state"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  accentColor,
  description,
  icon: Icon,
  loading,
  title,
  value,
}: {
  accentColor: "sky" | "emerald" | "red" | "violet" | "muted"
  description: string
  icon: React.ComponentType<{ className?: string }>
  loading?: boolean
  title: string
  value: string
}) {
  const colorMap = {
    sky: { wrap: "bg-sky-500/10 text-sky-400 border-sky-500/20", glow: "bg-sky-500/10" },
    emerald: {
      wrap: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      glow: "bg-emerald-500/10",
    },
    red: { wrap: "bg-red-500/10 text-red-400 border-red-500/20", glow: "bg-red-500/10" },
    violet: {
      wrap: "bg-violet-500/10 text-violet-400 border-violet-500/20",
      glow: "bg-violet-500/10",
    },
    muted: { wrap: "bg-muted text-muted-foreground border-border", glow: "" },
  }
  const c = colorMap[accentColor]

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:-translate-y-px">
      {c.glow && (
        <div
          className={`pointer-events-none absolute -right-4 -top-4 size-24 rounded-full blur-2xl opacity-60 ${c.glow}`}
          aria-hidden="true"
        />
      )}
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
          )}
        </div>
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg border ${c.wrap}`}
        >
          <Icon className="size-4" />
        </div>
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

// ─── Health summary card ──────────────────────────────────────────────────────

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
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {loading ? (
          <>
            <Skeleton className="h-1.5 w-full rounded-full" />
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
  )
}

// ─── Health metric tile ───────────────────────────────────────────────────────

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
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-2">
        {status}
        <span className="text-sm font-semibold">{formatNumber(count, locale)}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  description: string
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
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
  const onlineAgents = agents.filter((a) => a.status === "ONLINE").length
  const offlineAgents = agents.filter((a) => a.status === "OFFLINE").length
  const pendingAgents = agents.filter((a) => a.status === "PENDING").length
  const unknownAgents = agents.filter((a) => a.status === "UNKNOWN").length

  const attentionServers = offlineCount + unknownCount
  const attentionAgents = offlineAgents + pendingAgents + unknownAgents

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ── Page header ── */}
        <PageHeader
          badge={
            <Badge
              className="w-fit border-white/10 bg-white/5 text-white/50"
              variant="outline"
            >
              <Radio className="size-3" />
              {summaryQuery.isLoading
                ? t("common.checking")
                : t("dashboard.liveOverview")}
            </Badge>
          }
          subtitle={instance.description}
          title={instance.name}
        />

        {/* ── Stat cards ── */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            accentColor="sky"
            description={t("dashboard.serversTracked")}
            icon={Server}
            loading={summaryQuery.isLoading}
            title={t("navigation.servers")}
            value={formatNumber(totalServers, locale)}
          />
          <StatCard
            accentColor="emerald"
            description={t("dashboard.serversOnline")}
            icon={CheckCircle2}
            loading={summaryQuery.isLoading}
            title={t("dashboard.onlineServers")}
            value={formatNumber(onlineCount, locale)}
          />
          <StatCard
            accentColor={attentionServers > 0 ? "red" : "muted"}
            description={t("dashboard.needsAttentionDescription")}
            icon={WifiOff}
            loading={summaryQuery.isLoading}
            title={t("dashboard.needsAttention")}
            value={formatNumber(attentionServers, locale)}
          />
          <StatCard
            accentColor="violet"
            description={t("dashboard.registeredAgentsDescription")}
            icon={Bot}
            loading={agentsQuery.isLoading}
            title={t("navigation.agents")}
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
            segments={[
              {
                className: "bg-emerald-500",
                label: t("statuses.ONLINE"),
                value: onlineCount,
              },
              {
                className: "bg-red-500",
                label: t("statuses.OFFLINE"),
                value: offlineCount,
              },
              {
                className: "bg-amber-500",
                label: t("statuses.UNKNOWN"),
                value: unknownCount,
              },
            ]}
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
                  count={pendingAgents + unknownAgents}
                  helper={t("dashboard.pendingUnknownAgents")}
                  status={<AgentStatusBadge status="PENDING" />}
                />
              </>
            }
            loading={agentsQuery.isLoading}
            segments={[
              {
                className: "bg-emerald-500",
                label: t("statuses.ONLINE"),
                value: onlineAgents,
              },
              {
                className: "bg-red-500",
                label: t("statuses.OFFLINE"),
                value: offlineAgents,
              },
              {
                className: "bg-amber-500",
                label: t("statuses.PENDING"),
                value: pendingAgents + unknownAgents,
              },
            ]}
            title={t("dashboard.agentHealth")}
            total={totalAgents}
          />
        </div>

        {/* ── Recent servers + agents ── */}
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <SectionCard
            description={t("dashboard.recentServersDescription")}
            icon={Server}
            title={t("dashboard.recentServers")}
          >
            {serversQuery.isLoading && <Skeleton className="h-72 w-full" />}
            {serversQuery.isError && (
              <ServerErrorState
                message={
                  serversQuery.error instanceof Error
                    ? serversQuery.error.message
                    : t("servers.unexpectedError")
                }
                onRetry={() => void serversQuery.refetch()}
              />
            )}
            {serversQuery.isSuccess && servers.length === 0 && <ServerEmptyState />}
            {serversQuery.isSuccess && servers.length > 0 && (
              <ServerTable
                canDelete={canDeleteServers(session?.user.permissions)}
                canEdit={canUpdateServers(session?.user.permissions)}
                servers={servers.slice(0, 5)}
              />
            )}
          </SectionCard>

          <SectionCard
            description={t("dashboard.recentAgentsDescription")}
            icon={Bot}
            title={t("dashboard.recentAgents")}
          >
            {agentsQuery.isLoading && <Skeleton className="h-72 w-full" />}
            {agentsQuery.isError && (
              <AgentErrorState
                message={
                  agentsQuery.error instanceof Error
                    ? agentsQuery.error.message
                    : t("agents.unexpectedError")
                }
                onRetry={() => void agentsQuery.refetch()}
              />
            )}
            {agentsQuery.isSuccess && agents.length === 0 && (
              <SectionState
                description={t("dashboard.noAgentsEnrolledDescription")}
                icon={<Bot className="size-5" />}
                title={t("dashboard.noAgentsEnrolled")}
              />
            )}
            {agentsQuery.isSuccess && agents.length > 0 && (
              <AgentTable agents={agents.slice(0, 5)} compact />
            )}
          </SectionCard>
        </div>

        {/* ── Attention banner ── */}
        {(attentionServers > 0 || attentionAgents > 0) && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center">
              <AlertCircle className="size-4 shrink-0 text-amber-400" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-amber-200">
                  {t("dashboard.operationalAttention")}
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("dashboard.attentionSummary", {
                    servers: formatNumber(attentionServers, locale),
                    agents: formatNumber(attentionAgents, locale),
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Recent activity ── */}
        <RecentActivityWidget />
      </div>
    </AppShell>
  )
}
