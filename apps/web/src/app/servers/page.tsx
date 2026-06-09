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
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";

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
import { canDeleteServers, canManageServers } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const serverStatuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const;
const pageSizeOptions = [10, 20, 50] as const;

export default function ServerInventoryPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const mayManageServers = canManageServers(session?.user.role);
  const mayDeleteServers = canDeleteServers(session?.user.role);
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
        <PageHeader
          badge={
            serversQuery.data ? (
              <span className="text-sm text-muted-foreground">
                {t("servers.records", { count: totalElements })}
              </span>
            ) : null
          }
          subtitle={t("servers.subtitle")}
          title={t("servers.title")}
          actions={
            <>
              {mayManageServers ? <CreateServerDialog /> : null}
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
              {t("actions.refresh")}
            </Button>
            </>
          }
        />

        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Server className="size-4" />
                  {t("servers.inventory")}
                </CardTitle>
                <CardDescription>
                  {serversQuery.data
                    ? hasActiveFilters
                      ? t("servers.matchingServerCount", { count: totalElements })
                      : t("servers.serverCount", { count: totalElements })
                    : t("servers.loadingInventory")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 rounded-md border bg-muted/10 p-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_minmax(12rem,18rem)_auto] lg:items-end">
              <div className="grid gap-2">
                <Label htmlFor="server-search">{t("forms.search")}</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="server-search"
                    className="pl-8"
                    placeholder={t("forms.nameHostnameIp")}
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="server-status">{t("forms.status")}</Label>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value as ServerStatus | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger id="server-status" className="w-full">
                    <SelectValue placeholder={t("forms.allStatuses")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ALL">{t("forms.allStatuses")}</SelectItem>
                    {serverStatuses.map((serverStatus) => (
                      <SelectItem key={serverStatus} value={serverStatus}>
                        {t(`statuses.${serverStatus}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="server-tags">{t("forms.tags")}</Label>
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
                {t("actions.clear")}
              </Button>
            </div>

            {serversQuery.isLoading ? <ServerTableSkeleton /> : null}
            {serversQuery.isError ? (
              <ServerErrorState
                message={
                  serversQuery.error instanceof Error
                    ? serversQuery.error.message
                    : t("servers.unexpectedError")
                }
                onRetry={() => void serversQuery.refetch()}
              />
            ) : null}
            {serversQuery.isSuccess && servers.length === 0 ? (
              <ServerEmptyState />
            ) : null}
            {serversQuery.isSuccess && servers.length > 0 ? (
              <ServerTable
                canDelete={mayDeleteServers}
                canEdit={mayManageServers}
                servers={servers}
              />
            ) : null}
            {serversQuery.isSuccess ? (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {t("actions.showingRange", {
                    start: formatNumber(rangeStart, locale),
                    end: formatNumber(rangeEnd, locale),
                    total: formatNumber(totalElements, locale),
                  })}
                  <span className="ml-2 text-xs">
                    {t("actions.pageOf", {
                      page: totalPages === 0 ? 0 : displayedPage + 1,
                      total: totalPages,
                    })}
                    {serversQuery.isFetching ? ` - ${t("actions.updating")}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="server-page-size"
                  >
                    {t("actions.rows")}
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
                      aria-label={t("actions.rows")}
                      className="w-[7.5rem]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {t("actions.rowsCount", { count: size })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    aria-label={t("actions.previousPage")}
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
                    aria-label={t("actions.nextPage")}
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
