"use client";

import { Bot, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
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
import { cn } from "@/lib/utils";

export default function AgentsPage() {
  const agentsQuery = useAgents({ size: 50 });
  const agents = agentsQuery.data?.content ?? [];
  const totalElements = agentsQuery.data?.totalElements ?? agents.length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Enroll agents, copy one-time tokens, and monitor heartbeat status.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <RegisterAgentDialog />
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
          </div>
        </div>

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
