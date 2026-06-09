"use client";

import { Bot, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";

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
import { formatNumber } from "@/features/servers/format";
import { canManageAgents } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const { data: session } = useSession();
  const mayManageAgents = canManageAgents(session?.user.role);
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
                {formatNumber(totalElements)} registered
              </span>
            ) : null
          }
          subtitle="Enroll agents, rotate setup tokens, and monitor heartbeat status."
          title="Agents"
          actions={
            <>
              {mayManageAgents ? <RegisterAgentDialog /> : null}
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
              Refresh
            </Button>
            </>
          }
        />

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Bot className="size-4" />
              Agent registry
            </CardTitle>
            <CardDescription>
              {agentsQuery.data
                ? `${formatNumber(totalElements)} registered agents`
                : "Loading agents"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {agentsQuery.isLoading ? <AgentTableSkeleton /> : null}
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
