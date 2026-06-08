"use client";

import { Activity, AlertCircle, Server, WifiOff } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardSummary } from "@/features/dashboard/use-dashboard-summary";
import { formatNumber } from "@/features/servers/format";
import { ServerEmptyState } from "@/features/servers/server-empty-state";
import { ServerErrorState } from "@/features/servers/server-error-state";
import { ServerStatusBadge } from "@/features/servers/server-status-badge";
import { ServerTable } from "@/features/servers/server-table";
import { useServers } from "@/features/servers/use-servers";
import type { ServerStatus } from "@/lib/api/servers";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  empty,
  error,
  loading,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  empty?: boolean;
  error?: boolean;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : error ? (
          <div className="text-sm font-medium text-destructive">
            Unable to load
          </div>
        ) : (
          <div className="text-2xl font-semibold">{value}</div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {empty ? "No servers in inventory" : description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function DashboardOverviewPage() {
  const summaryQuery = useDashboardSummary();
  const serversQuery = useServers({ size: 20 });
  const servers = serversQuery.data?.content ?? [];
  const summary = summaryQuery.data;
  const summaryIsEmpty = (summary?.totalServers ?? null) === 0;
  const onlineCount = summary?.onlineServers ?? 0;
  const offlineCount = summary?.offlineServers ?? 0;
  const unknownCount = summary?.unknownServers ?? 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Current inventory health across managed servers.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            description="Servers tracked in inventory"
            icon={Server}
            empty={summaryIsEmpty}
            error={summaryQuery.isError}
            loading={summaryQuery.isLoading}
            title="Total servers"
            value={formatNumber(summary?.totalServers ?? 0)}
          />
          <StatCard
            description="Reporting an online state"
            icon={Activity}
            empty={summaryIsEmpty}
            error={summaryQuery.isError}
            loading={summaryQuery.isLoading}
            title="Online"
            value={formatNumber(onlineCount)}
          />
          <StatCard
            description="Marked offline by inventory"
            icon={WifiOff}
            empty={summaryIsEmpty}
            error={summaryQuery.isError}
            loading={summaryQuery.isLoading}
            title="Offline"
            value={formatNumber(offlineCount)}
          />
          <StatCard
            description="No clear operating state"
            icon={AlertCircle}
            empty={summaryIsEmpty}
            error={summaryQuery.isError}
            loading={summaryQuery.isLoading}
            title="Unknown"
            value={formatNumber(unknownCount)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <CardTitle>Recent inventory</CardTitle>
              <CardDescription>
                Latest servers returned by the inventory API.
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                <ServerTable servers={servers.slice(0, 5)} />
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status mix</CardTitle>
              <CardDescription>
                {summary?.generatedAt
                  ? `Generated ${new Date(summary.generatedAt).toLocaleString()}`
                  : "Inventory state at a glance."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {summaryQuery.isLoading ? (
                <>
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </>
              ) : summaryQuery.isError ? (
                <ServerErrorState
                  message={
                    summaryQuery.error instanceof Error
                      ? summaryQuery.error.message
                      : "The dashboard API returned an unexpected error."
                  }
                  onRetry={() => void summaryQuery.refetch()}
                />
              ) : summaryIsEmpty ? (
                <ServerEmptyState />
              ) : (
                [
                  ["ONLINE", onlineCount],
                  ["OFFLINE", offlineCount],
                  ["UNKNOWN", unknownCount],
                ].map(([status, count]) => (
                  <div
                    className="flex items-center justify-between rounded-md border bg-muted/20 p-3"
                    key={status}
                  >
                    <ServerStatusBadge status={status as ServerStatus} />
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
