"use client";

import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Server,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
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
import { CreateServerDialog } from "@/features/servers/create-server-dialog";
import { formatNumber } from "@/features/servers/format";
import { ServerEmptyState } from "@/features/servers/server-empty-state";
import { ServerErrorState } from "@/features/servers/server-error-state";
import { ServerTable } from "@/features/servers/server-table";
import { ServerTableSkeleton } from "@/features/servers/server-table-skeleton";
import { useServers } from "@/features/servers/use-servers";
import type { ServerStatus } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const serverStatuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const;
const pageSizeOptions = [10, 20, 50] as const;

export default function ServerInventoryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServerStatus | "ALL">("ALL");
  const [tags, setTags] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(
    20
  );
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const parsedTags = useMemo(() => parseTags(tags), [tags]);
  const hasActiveFilters =
    debouncedSearch.length > 0 || status !== "ALL" || parsedTags.length > 0;
  const serversQuery = useServers({
    page,
    size: pageSize,
    q: debouncedSearch,
    status: status === "ALL" ? undefined : status,
    tags: parsedTags,
  });
  const servers = serversQuery.data?.content ?? [];
  const totalElements = serversQuery.data?.totalElements ?? 0;
  const totalPages = serversQuery.data?.totalPages ?? 0;
  const displayedPage = serversQuery.data?.page ?? page;
  const rangeStart = totalElements === 0 ? 0 : displayedPage * pageSize + 1;
  const rangeEnd =
    totalElements === 0
      ? 0
      : Math.min(rangeStart + servers.length - 1, totalElements);
  const canGoBack = page > 0 && !serversQuery.isFetching;
  const canGoForward =
    totalPages > 0 && page + 1 < totalPages && !serversQuery.isFetching;

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
          <div className="flex flex-col gap-2 sm:flex-row">
            <CreateServerDialog />
            <Button
              disabled={serversQuery.isFetching}
              onClick={() => void serversQuery.refetch()}
              variant="outline"
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  serversQuery.isFetching && "animate-spin"
                )}
              />
              Refresh
            </Button>
          </div>
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
                        totalElements
                      )} ${hasActiveFilters ? "matching " : ""}servers`
                    : "Loading inventory"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_minmax(12rem,18rem)_auto] lg:items-end">
              <div className="grid gap-2">
                <Label htmlFor="server-search">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="server-search"
                    className="pl-8"
                    placeholder="Name, hostname, or IP address"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="server-status">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as ServerStatus | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger id="server-status" className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ALL">All statuses</SelectItem>
                    {serverStatuses.map((serverStatus) => (
                      <SelectItem key={serverStatus} value={serverStatus}>
                        {serverStatus}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="server-tags">Tags</Label>
                <Input
                  id="server-tags"
                  placeholder="prod, api"
                  value={tags}
                  onChange={(event) => {
                    setTags(event.target.value);
                    setPage(0);
                  }}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={
                  !hasActiveFilters && search.length === 0 && tags.length === 0
                }
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                  setTags("");
                  setPage(0);
                }}
              >
                <X className="size-4" />
                Clear
              </Button>
            </div>

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
            {serversQuery.isSuccess ? (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {formatNumber(rangeStart)}-{formatNumber(rangeEnd)}{" "}
                  of {formatNumber(totalElements)}
                  <span className="ml-2 text-xs">
                    Page {totalPages === 0 ? 0 : displayedPage + 1} of{" "}
                    {totalPages}
                    {serversQuery.isFetching ? " - Updating" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="server-page-size"
                  >
                    Rows
                  </Label>
                  <Select
                    value={String(pageSize)}
                    disabled={serversQuery.isFetching}
                    onValueChange={(value) => {
                      setPageSize(
                        Number(value) as (typeof pageSizeOptions)[number]
                      );
                      setPage(0);
                    }}
                  >
                    <SelectTrigger
                      id="server-page-size"
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
    </AppShell>
  );
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
