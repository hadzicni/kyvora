"use client";

import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

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
import { CreateServiceDialog } from "@/features/services/create-service-dialog";
import { ServiceEmptyState } from "@/features/services/service-empty-state";
import { ServiceErrorState } from "@/features/services/service-error-state";
import { serviceCategories } from "@/features/services/service-form";
import { ServiceTable } from "@/features/services/service-table";
import { ServiceTableSkeleton } from "@/features/services/service-table-skeleton";
import { useServices } from "@/features/services/use-services";
import { useServers } from "@/features/servers/use-servers";
import type { ServiceCategory } from "@/lib/api/services";
import {
  canCreateServices,
  canDeleteServices,
  canUpdateServices,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

const pageSizeOptions = [10, 20, 50] as const;
const sortOptions = [
  { labelKey: "forms.name", value: "name,asc" },
  { labelKey: "services.category", value: "category,asc" },
] as const;

export default function ServicesPage() {
  const t = useTranslations();
  const { data: session } = useSession();
  const mayCreateServices = canCreateServices(session?.user.permissions);
  const mayUpdateServices = canUpdateServices(session?.user.permissions);
  const mayDeleteServices = canDeleteServices(session?.user.permissions);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "ALL">("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof pageSizeOptions)[number]>(
    20
  );
  const [sort, setSort] = useState<(typeof sortOptions)[number]["value"]>(
    "name,asc"
  );
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const hasActiveFilters = debouncedSearch.length > 0 || category !== "ALL";
  const servicesQuery = useServices({
    page,
    size: pageSize,
    q: debouncedSearch,
    category: category === "ALL" ? undefined : category,
    sort,
  });
  const serversQuery = useServers({ size: 100, sort: "name,asc" });
  const servers = serversQuery.data?.content ?? [];
  const services = servicesQuery.data?.content ?? [];
  const totalElements = servicesQuery.data?.totalElements ?? 0;
  const totalPages = servicesQuery.data?.totalPages ?? 0;
  const displayedPage = servicesQuery.data?.page ?? page;
  const rangeStart = totalElements === 0 ? 0 : displayedPage * pageSize + 1;
  const rangeEnd =
    totalElements === 0
      ? 0
      : Math.min(rangeStart + services.length - 1, totalElements);
  const canGoBack = page > 0 && !servicesQuery.isFetching;
  const canGoForward =
    totalPages > 0 && page + 1 < totalPages && !servicesQuery.isFetching;
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            servicesQuery.data ? (
              <span className="text-sm text-muted-foreground">
                {t("services.count", { count: totalElements })}
              </span>
            ) : null
          }
          subtitle={t("services.subtitle")}
          title={t("services.title")}
          actions={
            <>
              {mayCreateServices ? (
                <CreateServiceDialog servers={servers} />
              ) : null}
              <Button
                disabled={servicesQuery.isFetching}
                onClick={() => void servicesQuery.refetch()}
                variant="outline"
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    servicesQuery.isFetching && "animate-spin"
                  )}
                />
                {t("actions.refresh")}
              </Button>
            </>
          }
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardDescription>{t("services.totalServices")}</CardDescription>
              <CardTitle>{totalElements}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>{t("services.shownOnPage")}</CardDescription>
              <CardTitle>{services.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4" />
              {t("services.registry")}
            </CardTitle>
            <CardDescription>
              {servicesQuery.data
                ? hasActiveFilters
                  ? t("services.matchingServices", { count: totalElements })
                  : t("services.registeredServices", { count: totalElements })
                : t("services.loadingServices")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 rounded-md border bg-muted/10 p-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto] lg:items-end">
              <div className="grid gap-2">
                <Label htmlFor="service-search">{t("forms.search")}</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="service-search"
                    className="pl-8"
                    placeholder={t("services.searchPlaceholder")}
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="service-category">{t("services.category")}</Label>
                <Select
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value as ServiceCategory | "ALL");
                    setPage(0);
                  }}
                >
                  <SelectTrigger id="service-category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ALL">
                      {t("services.allCategories")}
                    </SelectItem>
                    {serviceCategories.map((serviceCategory) => (
                      <SelectItem key={serviceCategory} value={serviceCategory}>
                        {t(`serviceCategories.${serviceCategory}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="service-sort">{t("services.sort")}</Label>
                <Select
                  value={sort}
                  onValueChange={(value) => {
                    setSort(value as (typeof sortOptions)[number]["value"]);
                    setPage(0);
                  }}
                >
                  <SelectTrigger id="service-sort" className="w-full">
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
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={!hasActiveFilters && search.length === 0}
                onClick={() => {
                  setSearch("");
                  setCategory("ALL");
                  setPage(0);
                }}
              >
                <X className="size-4" />
                {t("actions.clear")}
              </Button>
            </div>

            {servicesQuery.isLoading ? <ServiceTableSkeleton /> : null}
            {servicesQuery.isError ? (
              <ServiceErrorState
                message={
                  servicesQuery.error instanceof Error
                    ? servicesQuery.error.message
                    : t("services.unexpectedError")
                }
                onRetry={() => void servicesQuery.refetch()}
              />
            ) : null}
            {servicesQuery.isSuccess && services.length === 0 ? (
              <ServiceEmptyState />
            ) : null}
            {servicesQuery.isSuccess && services.length > 0 ? (
              <ServiceTable
                canDelete={mayDeleteServices}
                canEdit={mayUpdateServices}
                services={services}
                servers={servers}
              />
            ) : null}
            {servicesQuery.isSuccess ? (
              <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {t("actions.showingRange", {
                    start: rangeStart,
                    end: rangeEnd,
                    total: totalElements,
                  })}
                  <span className="ml-2 text-xs">
                    {t("actions.pageOf", {
                      page: totalPages === 0 ? 0 : displayedPage + 1,
                      total: totalPages,
                    })}
                    {servicesQuery.isFetching
                      ? ` - ${t("actions.updating")}`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    className="text-xs font-medium text-muted-foreground"
                    htmlFor="service-page-size"
                  >
                    {t("actions.rows")}
                  </Label>
                  <Select
                    value={String(pageSize)}
                    disabled={servicesQuery.isFetching}
                    onValueChange={(value) => {
                      setPageSize(
                        Number(value) as (typeof pageSizeOptions)[number]
                      );
                      setPage(0);
                    }}
                  >
                    <SelectTrigger
                      id="service-page-size"
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

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}
