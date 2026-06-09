"use client";

import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Eye,
  History,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  aggregateTypes,
  auditEventTypes,
  formatAuditEventType,
  formatTimestamp,
} from "@/features/audit-logs/format";
import { useAuditLogs } from "@/features/audit-logs/use-audit-logs";
import { formatNumber } from "@/features/servers/format";
import type { AuditEventType, AuditLog } from "@/lib/api/audit-logs";
import { cn } from "@/lib/utils";

const pageSizeOptions = [10, 20, 50] as const;

export default function ActivityPage() {
  const [aggregateType, setAggregateType] = useState<string>("ALL");
  const [eventType, setEventType] = useState<AuditEventType | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(
    20
  );
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const auditLogsQuery = useAuditLogs({
    page,
    size: pageSize,
    aggregateType: aggregateType === "ALL" ? undefined : aggregateType,
    eventType: eventType === "ALL" ? undefined : eventType,
  });
  const auditLogs = useMemo(
    () => auditLogsQuery.data?.content ?? [],
    [auditLogsQuery.data?.content]
  );
  const normalizedSearch = search.trim().toLowerCase();
  const visibleLogs = useMemo(() => {
    if (!normalizedSearch) {
      return auditLogs;
    }

    return auditLogs.filter((auditLog) => {
      return (
        formatActivityMessage(auditLog).toLowerCase().includes(normalizedSearch) ||
        auditLog.actor.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [auditLogs, normalizedSearch]);
  const totalElements = auditLogsQuery.data?.totalElements ?? 0;
  const totalPages = auditLogsQuery.data?.totalPages ?? 0;
  const displayedPage = auditLogsQuery.data?.page ?? page;
  const rangeStart = totalElements === 0 ? 0 : displayedPage * pageSize + 1;
  const rangeEnd =
    totalElements === 0
      ? 0
      : Math.min(rangeStart + auditLogs.length - 1, totalElements);
  const hasActiveFilters =
    aggregateType !== "ALL" || eventType !== "ALL" || search.trim().length > 0;
  const canGoBack = page > 0 && !auditLogsQuery.isFetching;
  const canGoForward =
    totalPages > 0 && page + 1 < totalPages && !auditLogsQuery.isFetching;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inspect audit events recorded by /api/v1/audit-logs.
            </p>
          </div>
          <Button
            disabled={auditLogsQuery.isFetching}
            onClick={() => void auditLogsQuery.refetch()}
            variant="outline"
          >
            <RefreshCw
              className={cn(
                "size-4",
                auditLogsQuery.isFetching && "animate-spin"
              )}
            />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <History className="size-4" />
              Audit logs
            </CardTitle>
            <CardDescription>
              {auditLogsQuery.data
                ? `${formatNumber(totalElements)} recorded events`
                : "Loading activity"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_12rem_16rem_auto] xl:items-end">
              <div className="grid gap-2">
                <Label htmlFor="activity-search">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="activity-search"
                    className="pl-8"
                    placeholder="Message or actor"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="activity-aggregate-type">Aggregate</Label>
                <Select
                  value={aggregateType}
                  onValueChange={(value) => {
                    setAggregateType(value);
                    setPage(0);
                  }}
                >
                  <SelectTrigger
                    id="activity-aggregate-type"
                    className="w-full"
                  >
                    <SelectValue placeholder="All aggregates" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ALL">All aggregates</SelectItem>
                    {aggregateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="activity-event-type">Event type</Label>
                <Select
                  value={eventType}
                  onValueChange={(value) => {
                    setEventType(value as AuditEventType | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger id="activity-event-type" className="w-full">
                    <SelectValue placeholder="All events" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ALL">All events</SelectItem>
                    {auditEventTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatAuditEventType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={!hasActiveFilters}
                onClick={() => {
                  setAggregateType("ALL");
                  setEventType("ALL");
                  setSearch("");
                  setPage(0);
                }}
              >
                <X className="size-4" />
                Clear
              </Button>
            </div>

            {auditLogsQuery.isLoading ? <ActivityTableSkeleton /> : null}
            {auditLogsQuery.isError ? (
              <ActivityErrorState
                message={
                  auditLogsQuery.error instanceof Error
                    ? auditLogsQuery.error.message
                    : "The audit log API returned an unexpected error."
                }
                onRetry={() => void auditLogsQuery.refetch()}
              />
            ) : null}
            {auditLogsQuery.isSuccess && auditLogs.length === 0 ? (
              <ActivityEmptyState />
            ) : null}
            {auditLogsQuery.isSuccess &&
            auditLogs.length > 0 &&
            visibleLogs.length === 0 ? (
              <ActivityEmptySearchState />
            ) : null}
            {auditLogsQuery.isSuccess && visibleLogs.length > 0 ? (
              <ActivityTable
                auditLogs={visibleLogs}
                onInspect={(auditLog) => setSelectedLog(auditLog)}
              />
            ) : null}
            {auditLogsQuery.isSuccess ? (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {formatNumber(rangeStart)}-{formatNumber(rangeEnd)}{" "}
                  of {formatNumber(totalElements)}
                  {normalizedSearch ? (
                    <span className="ml-2 text-xs">
                      {formatNumber(visibleLogs.length)} matching rows on this
                      page
                    </span>
                  ) : null}
                  <span className="ml-2 text-xs">
                    Page {totalPages === 0 ? 0 : displayedPage + 1} of{" "}
                    {totalPages}
                    {auditLogsQuery.isFetching ? " - Updating" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="activity-page-size"
                  >
                    Rows
                  </Label>
                  <Select
                    value={String(pageSize)}
                    disabled={auditLogsQuery.isFetching}
                    onValueChange={(value) => {
                      setPageSize(
                        Number(value) as (typeof pageSizeOptions)[number]
                      );
                      setPage(0);
                    }}
                  >
                    <SelectTrigger
                      id="activity-page-size"
                      aria-label="Rows per page"
                      className="w-[7.5rem]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size} rows
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    aria-label="Previous page"
                    disabled={!canGoBack}
                    onClick={() =>
                      setPage((currentPage) => Math.max(0, currentPage - 1))
                    }
                    size="icon"
                    variant="outline"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    aria-label="Next page"
                    disabled={!canGoForward}
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    size="icon"
                    variant="outline"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <ActivityDetailSheet
        auditLog={selectedLog}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLog(null);
          }
        }}
      />
    </AppShell>
  );
}

function metadataString(auditLog: AuditLog, key: string) {
  const value = auditLog.metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function formatActivityMessage(auditLog: AuditLog) {
  const serverName = metadataString(auditLog, "serverName");
  const hostname = metadataString(auditLog, "hostname");

  switch (auditLog.eventType) {
    case "AGENT_REGISTERED":
    case "AGENT_ENROLLED":
      return `Agent enrolled${serverName ? ` for server ${serverName}` : ""}`;
    case "AGENT_CONNECTED":
      return `Agent connected${hostname ? ` from ${hostname}` : ""}`;
    case "AGENT_MARKED_ONLINE":
      return `Agent marked online${hostname ? ` from ${hostname}` : ""}`;
    case "AGENT_MARKED_OFFLINE":
      return "Agent marked offline after missed heartbeats";
    case "SERVER_MARKED_ONLINE_BY_AGENT":
      return "Server marked online by agent";
    case "SERVER_MARKED_OFFLINE_BY_AGENT":
      return "Server marked offline by agent";
    case "AGENT_TOKEN_ROTATED":
      return "Agent token rotated";
    case "AGENT_ENROLLMENT_CANCELED":
      return "Agent enrollment canceled";
    case "AGENT_DECOMMISSIONED":
      return `Agent decommissioned${serverName ? ` from server ${serverName}` : ""}`;
    default:
      return auditLog.message;
  }
}

function serverIdFor(auditLog: AuditLog) {
  if (auditLog.aggregateType === "SERVER") {
    return auditLog.aggregateId;
  }
  return metadataString(auditLog, "serverId");
}

function ServerLink({
  auditLog,
  fallback,
}: {
  auditLog: AuditLog;
  fallback: string;
}) {
  const serverId = serverIdFor(auditLog);

  if (!serverId) {
    return fallback;
  }

  return (
    <Link
      className="underline-offset-4 hover:text-foreground hover:underline"
      href={`/servers/${encodeURIComponent(serverId)}`}
    >
      {fallback}
    </Link>
  );
}

function AggregateLink({
  auditLog,
  fallback,
}: {
  auditLog: AuditLog;
  fallback: string;
}) {
  if (auditLog.aggregateType === "AGENT") {
    return (
      <Link
        className="underline-offset-4 hover:text-foreground hover:underline"
        href={`/agents/${encodeURIComponent(auditLog.aggregateId)}`}
      >
        {fallback}
      </Link>
    );
  }

  return <ServerLink auditLog={auditLog} fallback={fallback} />;
}

function ActivityTable({
  auditLogs,
  onInspect,
}: {
  auditLogs: AuditLog[];
  onInspect: (auditLog: AuditLog) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Event</TableHead>
          <TableHead>Aggregate</TableHead>
          <TableHead>Aggregate ID</TableHead>
          <TableHead>Actor</TableHead>
          <TableHead>Message</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>
            <span className="sr-only">Details</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {auditLogs.map((auditLog) => (
          <TableRow key={auditLog.id}>
            <TableCell>
              <Badge variant="outline">
                {formatAuditEventType(auditLog.eventType)}
              </Badge>
            </TableCell>
            <TableCell className="font-mono text-xs">
              {auditLog.aggregateType}
            </TableCell>
            <TableCell className="max-w-[14rem] truncate font-mono text-xs text-muted-foreground">
              <AggregateLink
                auditLog={auditLog}
                fallback={
                  metadataString(auditLog, "agentName") ?? auditLog.aggregateId
                }
              />
            </TableCell>
            <TableCell>{auditLog.actor}</TableCell>
            <TableCell className="min-w-[18rem] max-w-md whitespace-normal">
              <span className="line-clamp-2">
                {formatActivityMessage(auditLog)}
              </span>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatTimestamp(auditLog.createdAt)}
            </TableCell>
            <TableCell className="text-right">
              <Button
                aria-label={`Inspect ${auditLog.eventType}`}
                onClick={() => onInspect(auditLog)}
                size="icon-sm"
                variant="ghost"
              >
                <Eye className="size-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ActivityTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {[
            "Event",
            "Aggregate",
            "Aggregate ID",
            "Actor",
            "Message",
            "Created",
            "",
          ].map((heading, index) => (
            <TableHead key={`${heading}-${index}`}>{heading}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: 7 }).map((__, cellIndex) => (
              <TableCell key={cellIndex}>
                <Skeleton className="h-5 w-full max-w-40" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ActivityEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
        <History className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium">No activity found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Audit events will appear here once Kyvora records infrastructure
        changes.
      </p>
    </div>
  );
}

function ActivityEmptySearchState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
        <Search className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium">No matching activity</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No audit events on this page match the current message or actor search.
      </p>
    </div>
  );
}

function ActivityErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="text-base font-medium">Unable to load activity</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button className="mt-5" onClick={onRetry} variant="outline">
        Retry
      </Button>
    </div>
  );
}

function ActivityDetailSheet({
  auditLog,
  onOpenChange,
}: {
  auditLog: AuditLog | null;
  onOpenChange: (open: boolean) => void;
}) {
  const metadataJson = auditLog
    ? JSON.stringify(auditLog.metadata, null, 2)
    : "";

  return (
    <Sheet open={Boolean(auditLog)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="border-b pr-12">
          <SheetTitle>
            {auditLog ? formatAuditEventType(auditLog.eventType) : "Activity"}
          </SheetTitle>
          <SheetDescription>
            {auditLog ? formatActivityMessage(auditLog) : "Audit log details"}
          </SheetDescription>
        </SheetHeader>
        {auditLog ? (
          <div className="space-y-5 px-4 pb-4">
            <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
              <DetailRow label="eventType" value={auditLog.eventType} />
              <DetailRow
                label="aggregateType"
                value={auditLog.aggregateType}
              />
              <DetailRow label="aggregateId" value={auditLog.aggregateId} />
              <AgentDetailLink auditLog={auditLog} />
              <ServerDetailLink auditLog={auditLog} />
              <DetailRow label="actor" value={auditLog.actor} />
              <DetailRow
                label="createdAt"
                value={`${auditLog.createdAt} (${formatTimestamp(
                  auditLog.createdAt
                )})`}
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium">Message</h2>
              <p className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                {formatActivityMessage(auditLog)}
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium">Metadata JSON</h2>
              <pre className="max-h-[28rem] overflow-auto rounded-md border bg-muted/20 p-3 font-mono text-xs leading-5 text-muted-foreground">
                {metadataJson}
              </pre>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function AgentDetailLink({ auditLog }: { auditLog: AuditLog }) {
  if (auditLog.aggregateType !== "AGENT") {
    return null;
  }

  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-start">
      <div className="text-xs font-medium text-muted-foreground">agent</div>
      <Link
        className="min-w-0 break-words font-mono text-xs underline-offset-4 hover:text-foreground hover:underline"
        href={`/agents/${encodeURIComponent(auditLog.aggregateId)}`}
      >
        {metadataString(auditLog, "agentName") ?? auditLog.aggregateId}
      </Link>
    </div>
  );
}

function ServerDetailLink({ auditLog }: { auditLog: AuditLog }) {
  const serverId = metadataString(auditLog, "serverId");

  if (!serverId) {
    return null;
  }

  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-start">
      <div className="text-xs font-medium text-muted-foreground">server</div>
      <Link
        className="min-w-0 break-words font-mono text-xs underline-offset-4 hover:text-foreground hover:underline"
        href={`/servers/${encodeURIComponent(serverId)}`}
      >
        {metadataString(auditLog, "serverName") ?? serverId}
      </Link>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-start">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words font-mono text-xs">{value}</div>
    </div>
  );
}
