"use client"

import { Cable, RefreshCw } from "lucide-react"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useServers } from "@/features/servers/use-servers"
import { CreateServiceDialog } from "@/features/services/create-service-dialog"
import { ServiceEmptyState } from "@/features/services/service-empty-state"
import { ServiceErrorState } from "@/features/services/service-error-state"
import { serviceCategories } from "@/features/services/service-form"
import { ServiceTable } from "@/features/services/service-table"
import { ServiceTableSkeleton } from "@/features/services/service-table-skeleton"
import { useServices } from "@/features/services/use-services"
import type { ServiceCategory } from "@/lib/api/services"
import {
  canCreateServices,
  canDeleteServices,
  canUpdateServices,
} from "@/lib/permissions"
import { cn } from "@/lib/utils"

const pageSizeOptions = [10, 20, 50] as const
const sortOptions = [
  { labelKey: "forms.name", value: "name,asc" },
  { labelKey: "services.category", value: "category,asc" },
] as const

export default function ServicesPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const mayCreateServices = canCreateServices(session?.user.permissions)
  const mayUpdateServices = canUpdateServices(session?.user.permissions)
  const mayDeleteServices = canDeleteServices(session?.user.permissions)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<ServiceCategory | "ALL">("ALL")
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(20)
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>("name,asc")

  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const hasActiveFilters = debouncedSearch.length > 0 || category !== "ALL"

  const servicesQuery = useServices({
    category: category === "ALL" ? undefined : category,
    page,
    q: debouncedSearch,
    size: pageSize,
    sort,
  })
  const serversQuery = useServers({ size: 100, sort: "name,asc" })
  const servers = serversQuery.data?.content ?? []
  const services = servicesQuery.data?.content ?? []
  const totalElements = servicesQuery.data?.totalElements ?? 0

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          actions={
            <>
              <Button
                disabled={servicesQuery.isFetching}
                onClick={() => void servicesQuery.refetch()}
                variant="outline"
              >
                <RefreshCw
                  className={cn("size-4", servicesQuery.isFetching && "animate-spin")}
                />
                {t("actions.refresh")}
              </Button>
              {mayCreateServices ? <CreateServiceDialog servers={servers} /> : null}
            </>
          }
          badge={
            servicesQuery.data ? (
              <PageHeaderCount>
                {t("services.count", { count: totalElements })}
              </PageHeaderCount>
            ) : null
          }
          subtitle={t("services.subtitle")}
          title={t("services.title")}
        />

        <SectionCard
          description={
            servicesQuery.data
              ? hasActiveFilters
                ? t("services.matchingServices", { count: totalElements })
                : t("services.registeredServices", { count: totalElements })
              : t("services.loadingServices")
          }
          flush
          icon={<Cable />}
          title={t("services.registry")}
        >
          <DataToolbar
            onReset={() => {
              setSearch("")
              setCategory("ALL")
              setPage(0)
            }}
            resetDisabled={!hasActiveFilters && search.length === 0}
          >
            <ToolbarField
              className="lg:min-w-72 lg:flex-1"
              htmlFor="service-search"
              label={t("forms.search")}
            >
              <ToolbarSearch
                id="service-search"
                onChange={(value) => {
                  setSearch(value)
                  setPage(0)
                }}
                placeholder={t("services.searchPlaceholder")}
                value={search}
              />
            </ToolbarField>

            <ToolbarField
              className="lg:w-48"
              htmlFor="service-category"
              label={t("services.category")}
            >
              <Select
                onValueChange={(value) => {
                  setCategory(value as ServiceCategory | "ALL")
                  setPage(0)
                }}
                value={category}
              >
                <SelectTrigger className="w-full" id="service-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="ALL">{t("services.allCategories")}</SelectItem>
                  {serviceCategories.map((serviceCategory) => (
                    <SelectItem key={serviceCategory} value={serviceCategory}>
                      {t(`serviceCategories.${serviceCategory}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ToolbarField>

            <ToolbarField
              className="lg:w-48"
              htmlFor="service-sort"
              label={t("services.sort")}
            >
              <Select
                onValueChange={(value) => {
                  setSort(value as (typeof sortOptions)[number]["value"])
                  setPage(0)
                }}
                value={sort}
              >
                <SelectTrigger className="w-full" id="service-sort">
                  <span className="text-muted-foreground">{t("services.sort")}:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ToolbarField>
          </DataToolbar>

          {servicesQuery.isLoading ? (
            <SectionCardBand>
              <ServiceTableSkeleton />
            </SectionCardBand>
          ) : null}
          {servicesQuery.isError ? (
            <SectionCardBand>
              <ServiceErrorState
                message={
                  servicesQuery.error instanceof Error
                    ? servicesQuery.error.message
                    : t("services.unexpectedError")
                }
                onRetry={() => void servicesQuery.refetch()}
              />
            </SectionCardBand>
          ) : null}
          {servicesQuery.isSuccess && services.length === 0 ? (
            <SectionCardBand>
              <ServiceEmptyState />
            </SectionCardBand>
          ) : null}
          {servicesQuery.isSuccess && services.length > 0 ? (
            <ServiceTable
              canDelete={mayDeleteServices}
              canEdit={mayUpdateServices}
              servers={servers}
              services={services}
            />
          ) : null}
          {servicesQuery.isSuccess ? (
            <PaginationBar
              id="service"
              isFetching={servicesQuery.isFetching}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size)
                setPage(0)
              }}
              page={servicesQuery.data?.page ?? page}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              totalElements={totalElements}
              totalPages={servicesQuery.data?.totalPages ?? 0}
              visibleCount={services.length}
            />
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
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
