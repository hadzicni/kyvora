"use client";

import { CirclePlus, History, Pencil, Radio, Trash2, WifiOff } from "lucide-react";

import { SectionState } from "@/components/app/section-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServerErrorState } from "@/features/servers/server-error-state";
import type { AuditEventType } from "@/lib/api/audit-logs";

import { formatAuditEventType, formatTimestamp } from "./format";
import { useAuditLogs } from "./use-audit-logs";

const eventIcons = {
  SERVER_CREATED: CirclePlus,
  SERVER_UPDATED: Pencil,
  SERVER_DELETED: Trash2,
  SERVER_MARKED_ONLINE_BY_AGENT: Radio,
  SERVER_MARKED_OFFLINE_BY_AGENT: WifiOff,
  AGENT_REGISTERED: CirclePlus,
  AGENT_ENROLLED: CirclePlus,
  AGENT_CONNECTED: Radio,
  AGENT_HEARTBEAT_RECEIVED: Radio,
  AGENT_MARKED_ONLINE: Radio,
  AGENT_MARKED_OFFLINE: WifiOff,
  AGENT_TOKEN_ROTATED: Radio,
  AGENT_ENROLLMENT_CANCELED: Trash2,
  AGENT_DECOMMISSIONED: WifiOff,
} satisfies Record<
  AuditEventType,
  React.ComponentType<{ className?: string }>
>;

export function RecentActivityWidget() {
  const auditLogsQuery = useAuditLogs({
    aggregateType: "SERVER",
    size: 5,
  });
  const auditLogs = auditLogsQuery.data?.content ?? [];

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <History className="size-4" />
          Recent activity
        </CardTitle>
        <CardDescription>Latest inventory and agent lifecycle events.</CardDescription>
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
          <SectionState
            description="Audit events will appear here after server or agent lifecycle changes are recorded."
            icon={<History className="size-5" />}
            title="No activity yet"
          />
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
                        {formatAuditEventType(auditLog.eventType)}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatTimestamp(auditLog.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
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
