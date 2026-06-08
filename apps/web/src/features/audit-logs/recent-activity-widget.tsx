"use client";

import { CirclePlus, Pencil, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerEmptyState } from "@/features/servers/server-empty-state";
import { ServerErrorState } from "@/features/servers/server-error-state";
import type { AuditEventType } from "@/lib/api/audit-logs";

import { useAuditLogs } from "./use-audit-logs";

const eventLabels: Record<AuditEventType, string> = {
  SERVER_CREATED: "Created",
  SERVER_UPDATED: "Updated",
  SERVER_DELETED: "Deleted",
};

const eventIcons = {
  SERVER_CREATED: CirclePlus,
  SERVER_UPDATED: Pencil,
  SERVER_DELETED: Trash2,
} satisfies Record<
  AuditEventType,
  React.ComponentType<{ className?: string }>
>;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RecentActivityWidget() {
  const auditLogsQuery = useAuditLogs({
    aggregateType: "SERVER",
    size: 5,
  });
  const auditLogs = auditLogsQuery.data?.content ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest inventory changes.</CardDescription>
      </CardHeader>
      <CardContent>
        {auditLogsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}

        {auditLogsQuery.isError ? (
          <ServerErrorState
            message={
              auditLogsQuery.error instanceof Error
                ? auditLogsQuery.error.message
                : "The audit log API returned an unexpected error."
            }
            onRetry={() => void auditLogsQuery.refetch()}
          />
        ) : null}

        {auditLogsQuery.isSuccess && auditLogs.length === 0 ? (
          <ServerEmptyState />
        ) : null}

        {auditLogsQuery.isSuccess && auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((auditLog) => {
              const Icon = eventIcons[auditLog.eventType];

              return (
                <div
                  className="grid grid-cols-[2rem_1fr] gap-3 rounded-md border bg-muted/20 p-3"
                  key={auditLog.id}
                >
                  <div className="flex size-8 items-center justify-center rounded-md bg-background">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">
                        {eventLabels[auditLog.eventType]}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTimestamp(auditLog.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {auditLog.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
