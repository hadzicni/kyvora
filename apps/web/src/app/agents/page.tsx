"use client";

import { Bot, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentEmptyState } from "@/features/agents/agent-empty-state";
import { AgentErrorState } from "@/features/agents/agent-error-state";
import { AgentTable } from "@/features/agents/agent-table";
import { AgentTableSkeleton } from "@/features/agents/agent-table-skeleton";
import { RegisterAgentDialog } from "@/features/agents/register-agent-dialog";
import { useAgents } from "@/features/agents/use-agents";
import { canEnrollAgents } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const mayEnrollAgents = canEnrollAgents(session?.user.permissions);
  const agentsQuery = useAgents({ size: 50 });
  const agents = agentsQuery.data?.content ?? [];
  const totalElements = agentsQuery.data?.totalElements ?? agents.length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            agentsQuery.data ? (
              <span className="text-sm text-muted-foreground">
                {t("agents.registered", { count: totalElements })}
              </span>
            ) : null
          }
          subtitle={t("agents.subtitle")}
          title={t("agents.title")}
          actions={
            <>
              {mayEnrollAgents ? <RegisterAgentDialog /> : null}
            <Button
              disabled={agentsQuery.isFetching}
              onClick={() => void agentsQuery.refetch()}
              variant="outline"
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  agentsQuery.isFetching && "animate-spin"
                )}
              />
              {t("actions.refresh")}
            </Button>
            </>
          }
        />

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4" />
              {t("agents.registry")}
            </CardTitle>
            <CardDescription>
              {agentsQuery.data
                ? t("agents.registeredAgents", { count: totalElements })
                : t("agents.loadingAgents")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
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
            {agentsQuery.isSuccess && agents.length === 0 ? (
              <AgentEmptyState />
            ) : null}
            {agentsQuery.isSuccess && agents.length > 0 ? (
              <AgentTable agents={agents} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
