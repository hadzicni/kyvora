"use client"

import { RefreshCw, Server } from "lucide-react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { AppShell } from "@/components/app/app-shell"
import {
  DataToolbar,
  ToolbarField,
  ToolbarSearch,
} from "@/components/app/data-toolbar"
import { PageHeader, PageHeaderCount } from "@/components/app/page-header"
import { PaginationBar } from "@/components/app/pagination-bar"
import { SectionCard, SectionCardBand } from "@/components/app/section-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateServerDialog } from "@/features/servers/create-server-dialog"
import { ServerEmptyState } from "@/features/servers/server-empty-state"
import { ServerErrorState } from "@/features/servers/server-error-state"
import { ServerTable } from "@/features/servers/server-table"
import { ServerTableSkeleton } from "@/features/servers/server-table-skeleton"
import { useServers } from "@/features/servers/use-servers"
import type { ServerStatus } from "@/lib/api/servers"
import { canCreateServers, canDeleteServers, canUpdateServers } from "@/lib/permissions"
import { cn } from "@/lib/utils"

const serverStatuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const
const pageSizeOptions = [10, 20, 50] as const

export default function ServerInventoryPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const mayCreateServers = canCreateServers(session?.user.permissions)
  const mayUpdateServers = canUpdateServers(session?.user.permissions)
  const mayDeleteServers = canDeleteServers(session?.user.permissions)

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ServerStatus | "ALL">("ALL")
  const [tags, setTags] = useState("")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(20)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const parsedTags = useMemo(() => parseTags(tags), [tags])
  const hasActiveFilters =
    debouncedSearch.length > 0 || status !== "ALL" || parsedTags.length > 0
  const canReset = hasActiveFilters || search.length > 0 || tags.length > 0

  const serversQuery = useServers({
    page,
    q: debouncedSearch,
    size: pageSize,
    status: status === "ALL" ? undefined : status,
    tags: parsedTags,
  })
  const servers = serversQuery.data?.content ?? []
  const totalElements = serversQuery.data?.totalElements ?? 0

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button
                disabled={serversQuery.isFetching}
                onClick={() => void serversQuery.refetch()}
                variant="outline"
              >
                <RefreshCw
                  className={cn("size-4", serversQuery.isFetching && "animate-spin")}
                />
                {t("actions.refresh")}
              </Button>
              {mayCreateServers ? <CreateServerDialog /> : null}
            </>
          }
          badge={
            serversQuery.data ? (
              <PageHeaderCount>
                {t("servers.records", { count: totalElements })}
              </PageHeaderCount>
            ) : null
          }
          subtitle={t("servers.subtitle")}
          title={t("servers.title")}
        />

        <SectionCard
          description={
            serversQuery.data
              ? hasActiveFilters
                ? t("servers.matchingServerCount", { count: totalElements })
                : t("servers.serverCount", { count: totalElements })
              : t("servers.loadingInventory")
          }
          flush
          icon={<Server />}
          title={t("servers.inventory")}
        >
          <DataToolbar
            onReset={() => {
              setSearch("")
              setStatus("ALL")
              setTags("")
              setPage(0)
            }}
            resetDisabled={!canReset}
          >
            <ToolbarField
              className="lg:min-w-72 lg:flex-1"
              htmlFor="server-search"
              label={t("forms.search")}
            >
              <ToolbarSearch
                id="server-search"
                onChange={(value) => {
                  setSearch(value)
                  setPage(0)
                }}
                placeholder={t("forms.nameHostnameIp")}
                value={search}
              />
            </ToolbarField>

            <ToolbarField
              className="lg:w-48"
              htmlFor="server-status"
              label={t("forms.status")}
            >
              <Select
                onValueChange={(value) => {
                  setStatus(value as ServerStatus | "ALL")
                  setPage(0)
                }}
                value={status}
              >
                <SelectTrigger className="w-full" id="server-status">
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
            </ToolbarField>

            <ToolbarField
              className="lg:w-52"
              htmlFor="server-tags"
              label={t("forms.tags")}
            >
              <Input
                id="server-tags"
                onChange={(event) => {
                  setTags(event.target.value)
                  setPage(0)
                }}
                placeholder={`${t("forms.tags")}: prod, api`}
                value={tags}
              />
            </ToolbarField>
          </DataToolbar>

          {serversQuery.isLoading ? (
            <SectionCardBand>
              <ServerTableSkeleton />
            </SectionCardBand>
          ) : null}
          {serversQuery.isError ? (
            <SectionCardBand>
              <ServerErrorState
                message={
                  serversQuery.error instanceof Error
                    ? serversQuery.error.message
                    : t("servers.unexpectedError")
                }
                onRetry={() => void serversQuery.refetch()}
              />
            </SectionCardBand>
          ) : null}
          {serversQuery.isSuccess && servers.length === 0 ? (
            <SectionCardBand>
              <ServerEmptyState />
            </SectionCardBand>
          ) : null}
          {serversQuery.isSuccess && servers.length > 0 ? (
            <ServerTable
              canDelete={mayDeleteServers}
              canEdit={mayUpdateServers}
              servers={servers}
            />
          ) : null}
          {serversQuery.isSuccess ? (
            <PaginationBar
              id="server"
              isFetching={serversQuery.isFetching}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(0)
              }}
              page={serversQuery.data?.page ?? page}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              totalElements={totalElements}
              totalPages={serversQuery.data?.totalPages ?? 0}
              visibleCount={servers.length}
            />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  )
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  )
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timeout)
  }, [delay, value])

  return debouncedValue
}
