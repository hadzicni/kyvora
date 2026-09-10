"use client"

import { AlertCircle, Bot, CheckCircle2, Radio, Server, WifiOff } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"

import { AppShell } from "@/components/app/app-shell"
import { HealthBar, type HealthSegment } from "@/components/app/health-bar"
import { PageHeader } from "@/components/app/page-header"
import { SectionCard } from "@/components/app/section-card"
import { SectionState } from "@/components/app/section-state"
import { Stat, StatRow } from "@/components/app/stat-row"
import { StatusBadge, StatusDot } from "@/components/app/status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AgentEmptyState } from "@/features/agents/agent-empty-state"
import { AgentErrorState } from "@/features/agents/agent-error-state"
import { AgentTable } from "@/features/agents/agent-table"
import { useAgents } from "@/features/agents/use-agents"
import { RecentActivityWidget } from "@/features/audit-logs/recent-activity-widget"
import { useDashboardSummary } from "@/features/dashboard/use-dashboard-summary"
import { formatNumber } from "@/features/servers/format"
import { ServerEmptyState } from "@/features/servers/server-empty-state"
import { ServerErrorState } from "@/features/servers/server-error-state"
import { ServerTable } from "@/features/servers/server-table"
import { useServers } from "@/features/servers/use-servers"
import { getInstanceSettings } from "@/lib/api/settings"
import { canDeleteServers, canUpdateServers } from "@/lib/permissions"
import { type Tone, toneClass } from "@/lib/tone"
import { cn } from "@/lib/utils"

// ─── Health panel ─────────────────────────────────────────────────────────────

type HealthRow = {
  count: number
  helper: string
  label: string
  tone: Tone
}

/**
 * One half of the health panel. Servers and agents share a shape, so they share
 * a card and sit side by side instead of competing as two separate panels.
 */
function HealthColumn({
  caption,
  empty,
  error,
  loading,
  rows,
  title,
  total,
}: {
  caption: string
  empty: React.ReactNode
  error?: React.ReactNode
  loading?: boolean
  rows: HealthRow[]
  title: string
  total: number
}) {
  const locale = useLocale()
  const segments: HealthSegment[] = rows.map((row) => ({
    label: row.label,
    tone: row.tone,
    value: row.count,
  }))

  return (
    <div className="min-w-0 space-y-3 px-4 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="truncate text-xs text-muted-foreground">{caption}</span>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-24 w-full" />
        </>
      ) : error ? (
        error
      ) : total === 0 ? (
        empty
      ) : (
        <>
          <HealthBar segments={segments} total={total} />
          <dl className="space-y-2">
            {rows.map((row) => (
              <div className={cn("flex items-baseline gap-2", toneClass(row.tone))} key={row.label}>
                <StatusDot className="self-center" tone={row.tone} />
                <dt className="text-xs font-medium text-foreground">{row.label}</dt>
                <span className="truncate text-xs text-muted-foreground">
                  {row.helper}
                </span>
                <dd className="ml-auto text-sm font-semibold tabular-nums">
                  {formatNumber(row.count, locale)}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
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

  function statusRows(online: number, offline: number, unknown: number): HealthRow[] {
    return [
      {
        count: online,
        helper: t("dashboard.acceptingHeartbeats"),
        label: t("statuses.ONLINE"),
        tone: "success",
      },
      {
        count: offline,
        helper: t("dashboard.noRecentHeartbeat"),
        label: t("statuses.OFFLINE"),
        tone: "danger",
      },
      {
        count: unknown,
        helper: t("dashboard.noClearState"),
        label: t("statuses.UNKNOWN"),
        tone: "warning",
      },
    ]
  }

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

        {/* ── Headline figures ── */}
        <StatRow>
          <Stat
            hint={t("dashboard.serversTracked")}
            icon={Server}
            label={t("navigation.servers")}
            loading={summaryQuery.isLoading}
            tone="info"
            value={formatNumber(totalServers, locale)}
          />
          <Stat
            hint={t("dashboard.serversOnline")}
            icon={CheckCircle2}
            label={t("dashboard.onlineServers")}
            loading={summaryQuery.isLoading}
            tone="success"
            value={formatNumber(onlineCount, locale)}
          />
          <Stat
            hint={t("dashboard.needsAttentionDescription")}
            icon={WifiOff}
            label={t("dashboard.needsAttention")}
            loading={summaryQuery.isLoading}
            tone={attentionServers > 0 ? "danger" : "neutral"}
            value={formatNumber(attentionServers, locale)}
          />
          <Stat
            hint={t("dashboard.registeredAgentsDescription")}
            icon={Bot}
            label={t("navigation.agents")}
            loading={agentsQuery.isLoading}
            tone="brand"
            value={formatNumber(totalAgents, locale)}
          />
        </StatRow>

        {/* ── Attention banner ── */}
        {attentionServers > 0 || attentionAgents > 0 ? (
          <div className="tone-warning flex flex-wrap items-center gap-3 rounded-xl border tone-surface px-4 py-3">
            <AlertCircle aria-hidden="true" className="size-4 shrink-0 tone-text" />
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{t("dashboard.operationalAttention")}</span>{" "}
              <span className="text-muted-foreground">
                {t("dashboard.attentionSummary", {
                  agents: formatNumber(attentionAgents, locale),
                  servers: formatNumber(attentionServers, locale),
                })}
              </span>
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href="/servers">{t("actions.viewAll")}</Link>
            </Button>
          </div>
        ) : null}

        {/* ── Health ── */}
        <SectionCard
          description={t("dashboard.inventoryHealth")}
          flush
          title={t("dashboard.serverHealth")}
        >
          <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x md:divide-y-0">
            <HealthColumn
              caption={
                summary?.generatedAt
                  ? new Date(summary.generatedAt).toLocaleTimeString(locale)
                  : ""
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
              loading={summaryQuery.isLoading}
              rows={statusRows(onlineCount, offlineCount, unknownCount)}
              title={t("navigation.servers")}
              total={totalServers}
            />
            <HealthColumn
              caption={t("dashboard.agentHealthDescription")}
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
              loading={agentsQuery.isLoading}
              rows={statusRows(onlineAgents, offlineAgents, unknownAgents)}
              title={t("navigation.agents")}
              total={totalAgents}
            />
          </div>
        </SectionCard>

        {/* ── Recent servers ── */}
        <SectionCard
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/servers">{t("actions.viewAll")}</Link>
            </Button>
          }
          description={t("dashboard.recentServersDescription")}
          flush
          icon={<Server />}
          title={t("dashboard.recentServers")}
        >
          {serversQuery.isLoading ? (
            <div className="px-4 py-3">
              <Skeleton className="h-56 w-full" />
            </div>
          ) : null}
          {serversQuery.isError ? (
            <div className="px-4 py-3">
              <ServerErrorState
                message={
                  serversQuery.error instanceof Error
                    ? serversQuery.error.message
                    : t("servers.unexpectedError")
                }
                onRetry={() => void serversQuery.refetch()}
              />
            </div>
          ) : null}
          {serversQuery.isSuccess && servers.length === 0 ? (
            <div className="px-4 py-3">
              <ServerEmptyState />
            </div>
          ) : null}
          {serversQuery.isSuccess && servers.length > 0 ? (
            <ServerTable
              canDelete={canDeleteServers(session?.user.permissions)}
              canEdit={canUpdateServers(session?.user.permissions)}
              servers={servers.slice(0, 5)}
            />
          ) : null}
        </SectionCard>

        {/* ── Recent agents + activity ── */}
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <SectionCard
            action={
              <Button asChild size="sm" variant="ghost">
                <Link href="/agents">{t("actions.viewAll")}</Link>
              </Button>
            }
            description={t("dashboard.recentAgentsDescription")}
            flush
            icon={<Bot />}
            title={t("dashboard.recentAgents")}
          >
            {agentsQuery.isLoading ? (
              <div className="px-4 py-3">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : null}
            {agentsQuery.isError ? (
              <div className="px-4 py-3">
                <AgentErrorState
                  message={
                    agentsQuery.error instanceof Error
                      ? agentsQuery.error.message
                      : t("agents.unexpectedError")
                  }
                  onRetry={() => void agentsQuery.refetch()}
                />
              </div>
            ) : null}
            {agentsQuery.isSuccess && agents.length === 0 ? (
              <div className="px-4 py-3">
                <SectionState
                  description={t("dashboard.noAgentsEnrolledDescription")}
                  icon={<Bot className="size-5" />}
                  size="sm"
                  title={t("dashboard.noAgentsEnrolled")}
                />
              </div>
            ) : null}
            {agentsQuery.isSuccess && agents.length > 0 ? (
              <AgentTable agents={agents.slice(0, 5)} compact />
            ) : null}
          </SectionCard>

          <RecentActivityWidget />
        </div>
      </div>
    </AppShell>
  )
}
