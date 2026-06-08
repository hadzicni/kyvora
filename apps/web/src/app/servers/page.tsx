"use client";

import { RefreshCw, Server } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatNumber } from "@/features/servers/format";
import { ServerEmptyState } from "@/features/servers/server-empty-state";
import { ServerErrorState } from "@/features/servers/server-error-state";
import { ServerTable } from "@/features/servers/server-table";
import { ServerTableSkeleton } from "@/features/servers/server-table-skeleton";
import { useServers } from "@/features/servers/use-servers";
import { cn } from "@/lib/utils";

export default function ServerInventoryPage() {
  const serversQuery = useServers({ size: 50 });
  const servers = serversQuery.data?.content ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Server inventory
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse servers reported by /api/v1/servers.
            </p>
          </div>
          <Button
            disabled={serversQuery.isFetching}
            onClick={() => void serversQuery.refetch()}
            variant="outline"
          >
            <RefreshCw
              className={cn("size-4", serversQuery.isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="size-4" />
                  Inventory
                </CardTitle>
                <CardDescription>
                  {serversQuery.data
                    ? `${formatNumber(
                        serversQuery.data.totalElements
                      )} servers total`
                    : "Loading inventory"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {serversQuery.isLoading ? <ServerTableSkeleton /> : null}
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
              <ServerTable servers={servers} />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
