"use client";

import {
  Cable,
  Database,
  Filter,
  Globe2,
  Info,
  LocateFixed,
  Maximize2,
  Network,
  PanelRightClose,
  RefreshCw,
  Search,
  Server,
  ShieldQuestion,
  SlidersHorizontal,
  Table2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppShell } from "@/components/app/app-shell";
import { SectionState } from "@/components/app/section-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopologyCanvas } from "@/features/network-map/topology-canvas";
import { useNetworkMap } from "@/features/network-map/use-network-map";
import { ServerStatusBadge } from "@/features/servers/server-status-badge";
import type {
  NetworkMapNode,
  NetworkMapSubnet,
} from "@/lib/api/network-map";
import type { ServerStatus } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const statuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const;
const emptyNodes: NetworkMapNode[] = [];
const emptySubnets: NetworkMapSubnet[] = [];

export default function NetworkMapPage() {
  const t = useTranslations();
  const locale = useLocale();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const networkMapQuery = useNetworkMap();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServerStatus | "ALL">("ALL");
  const [subnetId, setSubnetId] = useState("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const map = networkMapQuery.data;
  const allNodes = map?.nodes ?? emptyNodes;
  const allSubnets = map?.subnets ?? emptySubnets;
  const serverNodes = useMemo(
    () => allNodes.filter((node) => node.type === "SERVER"),
    [allNodes]
  );
  const filteredServerNodes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return serverNodes.filter((node) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          node.name,
          node.hostname,
          node.ipAddress,
          node.dnsName,
          node.operatingSystem,
          ...node.tags,
          ...node.services.map((service) => service.name),
        ]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(normalizedSearch));
      const matchesStatus = status === "ALL" || node.status === status;
      const matchesSubnet = subnetId === "ALL" || node.subnetId === subnetId;

      return matchesSearch && matchesStatus && matchesSubnet;
    });
  }, [search, serverNodes, status, subnetId]);
  const visibleSubnets = useMemo(
    () => getVisibleSubnets(allSubnets, filteredServerNodes, subnetId),
    [allSubnets, filteredServerNodes, subnetId]
  );
  const visibleNodes = useMemo(
    () =>
      getVisibleNodes({
        allNodes,
        filteredServerNodes,
        visibleSubnets,
      }),
    [allNodes, filteredServerNodes, visibleSubnets]
  );
  const selectedNode =
    visibleNodes.find((node) => node.id === selectedNodeId) ?? null;
  const hasActiveFilters =
    search.trim().length > 0 || status !== "ALL" || subnetId !== "ALL";
  const summary = useMemo(() => getSummary(serverNodes), [serverNodes]);
  const generatedAt = map
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(map.generatedAt))
    : null;

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setSubnetId("ALL");
  }

  function requestFullscreen() {
    void workspaceRef.current?.requestFullscreen?.();
  }

  return (
    <AppShell contentClassName="max-w-none px-2 py-2 md:px-3">
      <div className="flex min-h-[calc(100vh-5rem)] flex-col gap-2">
        <header className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card/70 px-3 py-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Network className="size-4 text-muted-foreground" />
              <h1 className="truncate text-base font-semibold">
                {t("networkMap.title")}
              </h1>
            </div>
            {generatedAt ? (
              <p className="truncate text-xs text-muted-foreground">
                {t("networkMap.generated", { date: generatedAt })}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setFiltersOpen((current) => !current)}
              size="sm"
              type="button"
              variant={filtersOpen || hasActiveFilters ? "default" : "outline"}
            >
              <SlidersHorizontal className="size-4" />
              {t("networkMap.filters")}
            </Button>
            <Button
              onClick={() => setShowList((current) => !current)}
              size="sm"
              type="button"
              variant={showList ? "default" : "outline"}
            >
              <Table2 className="size-4" />
              {t("networkMap.listFallback")}
            </Button>
            <Button
              disabled={!selectedNodeId}
              onClick={() => setSelectedNodeId(null)}
              size="icon"
              type="button"
              variant="outline"
            >
              <PanelRightClose className="size-4" />
              <span className="sr-only">{t("networkMap.resetSelection")}</span>
            </Button>
            <Button
              onClick={requestFullscreen}
              size="icon"
              type="button"
              variant="outline"
            >
              <Maximize2 className="size-4" />
              <span className="sr-only">{t("networkMap.fullscreen")}</span>
            </Button>
            <Button
              disabled={networkMapQuery.isFetching}
              onClick={() => void networkMapQuery.refetch()}
              size="sm"
              variant="outline"
            >
              <RefreshCw
                className={cn(
                  "size-4",
                  networkMapQuery.isFetching && "animate-spin"
                )}
              />
              {t("actions.refresh")}
            </Button>
          </div>
        </header>

        <section
          className="relative min-h-[calc(100vh-9rem)] flex-1 overflow-hidden rounded-md border bg-background"
          ref={workspaceRef}
        >
          {networkMapQuery.isLoading ? (
            <WorkspaceState>
              <SectionState
                description={t("networkMap.loadingDescription")}
                icon={<Network className="size-6" />}
                title={`${t("common.loading")}...`}
              />
            </WorkspaceState>
          ) : null}

          {networkMapQuery.isError ? (
            <WorkspaceState>
              <SectionState
                action={
                  <Button
                    onClick={() => void networkMapQuery.refetch()}
                    variant="outline"
                  >
                    <RefreshCw className="size-4" />
                    {t("actions.retry")}
                  </Button>
                }
                description={
                  networkMapQuery.error instanceof Error
                    ? networkMapQuery.error.message
                    : t("networkMap.unexpectedError")
                }
                icon={<Network className="size-6" />}
                title={t("networkMap.errorTitle")}
                tone="destructive"
              />
            </WorkspaceState>
          ) : null}

          {networkMapQuery.isSuccess && serverNodes.length === 0 ? (
            <WorkspaceState>
              <SectionState
                description={t("networkMap.emptyDescription")}
                icon={<Network className="size-6" />}
                title={t("networkMap.emptyTitle")}
              />
            </WorkspaceState>
          ) : null}

          {networkMapQuery.isSuccess && serverNodes.length > 0 ? (
            <>
              {filteredServerNodes.length === 0 ? (
                <WorkspaceState>
                  <SectionState
                    description={t("networkMap.noMatchesDescription")}
                    icon={<Search className="size-6" />}
                    title={t("networkMap.noMatchesTitle")}
                  />
                </WorkspaceState>
              ) : (
                <TopologyCanvas
                  className="h-full min-h-[calc(100vh-9rem)]"
                  edges={map?.edges ?? []}
                  nodes={visibleNodes}
                  onSelectNode={setSelectedNodeId}
                  selectedNodeId={selectedNode?.id ?? null}
                  subnets={visibleSubnets}
                />
              )}

              <SummaryOverlay
                summary={summary}
                subnetCount={allSubnets.length}
                serverCount={serverNodes.length}
              />

              {filtersOpen ? (
                <FiltersPanel
                  hasActiveFilters={hasActiveFilters}
                  onClear={clearFilters}
                  onClose={() => setFiltersOpen(false)}
                  onSearchChange={setSearch}
                  onStatusChange={setStatus}
                  onSubnetChange={setSubnetId}
                  search={search}
                  status={status}
                  subnetId={subnetId}
                  subnets={allSubnets}
                />
              ) : null}

              <NetworkMapLegend />

              {selectedNode ? (
                <NodeDetails
                  node={selectedNode}
                  onClose={() => setSelectedNodeId(null)}
                />
              ) : null}
            </>
          ) : null}
        </section>

        {showList && networkMapQuery.isSuccess && serverNodes.length > 0 ? (
          <NodeTable nodes={filteredServerNodes} />
        ) : null}
      </div>
    </AppShell>
  );
}

function WorkspaceState({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6">
      {children}
    </div>
  );
}

function FiltersPanel({
  hasActiveFilters,
  onClear,
  onClose,
  onSearchChange,
  onStatusChange,
  onSubnetChange,
  search,
  status,
  subnetId,
  subnets,
}: {
  hasActiveFilters: boolean;
  onClear: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ServerStatus | "ALL") => void;
  onSubnetChange: (value: string) => void;
  search: string;
  status: ServerStatus | "ALL";
  subnetId: string;
  subnets: NetworkMapSubnet[];
}) {
  const t = useTranslations();

  return (
    <div className="absolute left-3 right-3 top-20 z-20 rounded-md border bg-popover/95 p-3 shadow-lg backdrop-blur md:left-3 md:right-auto md:w-[24rem]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4" />
          {t("networkMap.filters")}
        </div>
        <Button onClick={onClose} size="icon-sm" type="button" variant="ghost">
          <X className="size-4" />
          <span className="sr-only">{t("actions.close")}</span>
        </Button>
      </div>
      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label htmlFor="network-map-search">{t("forms.search")}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="network-map-search"
              className="pl-8"
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("networkMap.searchPlaceholder")}
              value={search}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="network-map-status">{t("forms.status")}</Label>
            <Select
              onValueChange={(value) =>
                onStatusChange(value as ServerStatus | "ALL")
              }
              value={status}
            >
              <SelectTrigger id="network-map-status" className="w-full">
                <SelectValue placeholder={t("forms.allStatuses")} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ALL">{t("forms.allStatuses")}</SelectItem>
                {statuses.map((entry) => (
                  <SelectItem key={entry} value={entry}>
                    {t(`statuses.${entry}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="network-map-subnet">{t("networkMap.subnet")}</Label>
            <Select onValueChange={onSubnetChange} value={subnetId}>
              <SelectTrigger id="network-map-subnet" className="w-full">
                <SelectValue placeholder={t("networkMap.allSubnets")} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="ALL">{t("networkMap.allSubnets")}</SelectItem>
                {subnets.map((subnet) => (
                  <SelectItem key={subnet.id} value={subnet.id}>
                    {subnet.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          disabled={!hasActiveFilters}
          onClick={onClear}
          type="button"
          variant="outline"
        >
          <X className="size-4" />
          {t("actions.clear")}
        </Button>
      </div>
    </div>
  );
}

function SummaryOverlay({
  serverCount,
  subnetCount,
  summary,
}: {
  serverCount: number;
  subnetCount: number;
  summary: ReturnType<typeof getSummary>;
}) {
  const t = useTranslations();

  return (
    <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 grid grid-cols-2 gap-2 sm:right-auto sm:w-[28rem] sm:grid-cols-4">
      <SummaryPill
        icon={<Network className="size-3.5" />}
        label={t("networkMap.subnets")}
        value={subnetCount}
      />
      <SummaryPill
        icon={<Server className="size-3.5" />}
        label={t("networkMap.servers")}
        value={serverCount}
      />
      <SummaryPill
        icon={<LocateFixed className="size-3.5" />}
        label={t("statuses.ONLINE")}
        value={summary.online}
      />
      <SummaryPill
        icon={<ShieldQuestion className="size-3.5" />}
        label={t("networkMap.needsAttention")}
        value={summary.offline + summary.unknown}
      />
    </div>
  );
}

function SummaryPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 text-lg font-semibold leading-none">{value}</div>
    </div>
  );
}

function NodeDetails({
  node,
  onClose,
}: {
  node: NetworkMapNode;
  onClose: () => void;
}) {
  const t = useTranslations();

  return (
    <aside className="absolute inset-x-3 bottom-3 z-20 max-h-[46%] min-w-0 overflow-y-auto rounded-md border bg-popover/95 p-4 shadow-lg backdrop-blur md:inset-x-auto md:bottom-3 md:right-3 md:top-3 md:max-h-none md:w-96">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Info className="size-4" />
            {t("networkMap.nodeDetails")}
          </div>
          <h2 className="mt-2 truncate text-base font-medium">{node.name}</h2>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {node.ipAddress ?? t("common.unknown")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ServerStatusBadge status={node.status} />
          <Button onClick={onClose} size="icon-sm" type="button" variant="ghost">
            <X className="size-4" />
            <span className="sr-only">{t("actions.close")}</span>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <DetailRow label={t("networkMap.type")} value={node.type} />
        <DetailRow label={t("forms.hostname")} value={node.hostname} />
        <DetailRow label={t("networkMap.dnsName")} value={node.dnsName} />
        <DetailRow label={t("forms.operatingSystem")} value={node.operatingSystem} />
        <DetailRow label={t("servers.lastSeenHeader")} value={node.lastSeenAt} />
      </div>

      <div className="mt-5 space-y-4">
        <DetailList
          emptyLabel={t("networkMap.noAdditionalIps")}
          icon={<Globe2 className="size-4" />}
          items={node.ipAddresses}
          title={t("networkMap.ipAddresses")}
        />
        <DetailList
          emptyLabel={t("networkMap.noOpenPorts")}
          icon={<Filter className="size-4" />}
          items={node.openPorts.map((port) =>
            `${port.protocol.toUpperCase()} ${port.port}${
              port.service ? ` ${port.service}` : ""
            }`
          )}
          title={t("networkMap.openPorts")}
        />
        <DetailList
          emptyLabel={t("networkMap.noServices")}
          icon={<Database className="size-4" />}
          items={node.services.map((service) =>
            `${service.name}${service.port ? `:${service.port}` : ""}`
          )}
          title={t("networkMap.services")}
        />
      </div>
    </aside>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words font-mono text-xs">
        {value || t("common.notProvided")}
      </div>
    </div>
  );
}

function DetailList({
  emptyLabel,
  icon,
  items,
  title,
}: {
  emptyLabel: string;
  icon: ReactNode;
  items: string[];
  title: string;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </h3>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge
              className="max-w-full break-all font-mono"
              key={item}
              variant="outline"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function NodeTable({ nodes }: { nodes: NetworkMapNode[] }) {
  const t = useTranslations();

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium">
        {t("networkMap.listFallback")}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("servers.nameHeader")}</TableHead>
            <TableHead>{t("forms.hostname")}</TableHead>
            <TableHead>{t("forms.ipAddress")}</TableHead>
            <TableHead>{t("forms.status")}</TableHead>
            <TableHead>{t("networkMap.services")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {nodes.map((node) => (
            <TableRow key={node.id}>
              <TableCell className="min-w-56">
                <div className="max-w-64 truncate font-medium">{node.name}</div>
              </TableCell>
              <TableCell>
                <div className="max-w-56 truncate font-mono text-xs text-muted-foreground">
                  {node.hostname ?? t("common.notProvided")}
                </div>
              </TableCell>
              <TableCell>
                <div className="max-w-48 truncate font-mono text-xs text-muted-foreground">
                  {node.ipAddress ?? t("common.notProvided")}
                </div>
              </TableCell>
              <TableCell>
                <ServerStatusBadge status={node.status} />
              </TableCell>
              <TableCell className="max-w-80 whitespace-normal text-muted-foreground">
                {node.services.length > 0
                  ? node.services.map((service) => service.name).join(", ")
                  : t("common.none")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NetworkMapLegend() {
  const t = useTranslations();

  return (
    <div className="absolute bottom-3 left-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-3 rounded-md border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur md:left-48">
      <LegendItem className="bg-emerald-400" label={t("statuses.ONLINE")} />
      <LegendItem className="bg-rose-400" label={t("statuses.OFFLINE")} />
      <LegendItem className="bg-amber-400" label={t("statuses.UNKNOWN")} />
      <span className="inline-flex min-w-0 items-center gap-1">
        <Cable className="size-3.5 shrink-0" />
        <span className="truncate">{t("networkMap.inferredGateway")}</span>
      </span>
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}

function getVisibleSubnets(
  subnets: NetworkMapSubnet[],
  servers: NetworkMapNode[],
  selectedSubnetId: string
) {
  const serverSubnetIds = new Set(servers.map((node) => node.subnetId));

  return subnets.filter(
    (subnet) =>
      serverSubnetIds.has(subnet.id) &&
      (selectedSubnetId === "ALL" || subnet.id === selectedSubnetId)
  );
}

function getVisibleNodes({
  allNodes,
  filteredServerNodes,
  visibleSubnets,
}: {
  allNodes: NetworkMapNode[];
  filteredServerNodes: NetworkMapNode[];
  visibleSubnets: NetworkMapSubnet[];
}) {
  const visibleSubnetIds = new Set(visibleSubnets.map((subnet) => subnet.id));
  const visibleServerIds = new Set(filteredServerNodes.map((node) => node.id));

  return allNodes.filter((node) => {
    if (!visibleSubnetIds.has(node.subnetId)) {
      return false;
    }

    return node.type === "GATEWAY" || visibleServerIds.has(node.id);
  });
}

function getSummary(nodes: NetworkMapNode[]) {
  return nodes.reduce(
    (summary, node) => ({
      online: summary.online + (node.status === "ONLINE" ? 1 : 0),
      offline: summary.offline + (node.status === "OFFLINE" ? 1 : 0),
      unknown: summary.unknown + (node.status === "UNKNOWN" ? 1 : 0),
    }),
    { online: 0, offline: 0, unknown: 0 }
  );
}
