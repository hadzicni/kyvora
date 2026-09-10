"use client"

import { Bot, RefreshCw } from "lucide-react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"

import { AppShell } from "@/components/app/app-shell"
import { PageHeader, PageHeaderCount } from "@/components/app/page-header"
import { SectionCard } from "@/components/app/section-card"
import { Button } from "@/components/ui/button"
import { AgentEmptyState } from "@/features/agents/agent-empty-state"
import { AgentErrorState } from "@/features/agents/agent-error-state"
import { AgentTable } from "@/features/agents/agent-table"
import { AgentTableSkeleton } from "@/features/agents/agent-table-skeleton"
import { RegisterAgentDialog } from "@/features/agents/register-agent-dialog"
import { useAgents } from "@/features/agents/use-agents"
import { canEnrollAgents } from "@/lib/permissions"
import { cn } from "@/lib/utils"

export default function AgentsPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const mayEnrollAgents = canEnrollAgents(session?.user.permissions)
  const agentsQuery = useAgents({ size: 50 })
  const agents = agentsQuery.data?.content ?? []
  const totalElements = agentsQuery.data?.totalElements ?? agents.length

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button
                disabled={agentsQuery.isFetching}
                onClick={() => void agentsQuery.refetch()}
                variant="outline"
              >
                <RefreshCw
                  className={cn("size-4", agentsQuery.isFetching && "animate-spin")}
                />
                {t("actions.refresh")}
              </Button>
              {mayEnrollAgents ? <RegisterAgentDialog /> : null}
            </>
          }
          badge={
            agentsQuery.data ? (
              <PageHeaderCount>
                {t("agents.registered", { count: totalElements })}
              </PageHeaderCount>
            ) : null
          }
          subtitle={t("agents.subtitle")}
          title={t("agents.title")}
        />

        <SectionCard
          description={
            agentsQuery.data
              ? t("agents.registeredAgents", { count: totalElements })
              : t("agents.loadingAgents")
          }
          icon={<Bot />}
          title={t("agents.registry")}
        >
          {agentsQuery.isLoading ? <AgentTableSkeleton /> : null}
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
          {agentsQuery.isSuccess && agents.length === 0 ? <AgentEmptyState /> : null}
          {agentsQuery.isSuccess && agents.length > 0 ? (
            <AgentTable agents={agents} />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  )
}
