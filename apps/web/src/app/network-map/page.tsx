"use client";

import {
  Cable,
  Database,
  Filter,
  Globe2,
  Info,
  LocateFixed,
  Network,
  RefreshCw,
  Search,
  Server,
  ShieldQuestion,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { SectionState } from "@/components/app/section-state";
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
import { ServerStatusBadge } from "@/features/servers/server-status-badge";
import { useNetworkMap } from "@/features/network-map/use-network-map";
import type {
  NetworkMapNode,
  NetworkMapSubnet,
} from "@/lib/api/network-map";
import type { ServerStatus } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const statuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const;

const nodeStatusClasses: Record<ServerStatus, string> = {
  ONLINE: "border-emerald-400/50 bg-emerald-500/10 shadow-emerald-950/20",
  OFFLINE: "border-rose-400/50 bg-rose-500/10 shadow-rose-950/20",
  UNKNOWN: "border-amber-400/50 bg-amber-500/10 shadow-amber-950/20",
};

export default function NetworkMapPage() {
  const t = useTranslations();
  const locale = useLocale();
  const networkMapQuery = useNetworkMap();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ServerStatus | "ALL">("ALL");
  const [subnetId, setSubnetId] = useState("ALL");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const map = networkMapQuery.data;
  const serverNodes = useMemo(
    () => map?.nodes.filter((node) => node.type === "SERVER") ?? [],
    [map]
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
  const filteredNodeIds = useMemo(
    () => new Set(filteredServerNodes.map((node) => node.id)),
    [filteredServerNodes]
  );
  const selectedNode =
    map?.nodes.find((node) => node.id === selectedNodeId) ??
    filteredServerNodes[0] ??
    null;
  const hasActiveFilters =
    search.trim().length > 0 || status !== "ALL" || subnetId !== "ALL";
  const summary = useMemo(() => getSummary(serverNodes), [serverNodes]);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            map ? (
              <span className="text-sm text-muted-foreground">
                {t("networkMap.generated", {
                  date: new Intl.DateTimeFormat(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(map.generatedAt)),
                })}
              </span>
            ) : null
          }
          subtitle={t("networkMap.subtitle")}
          title={t("networkMap.title")}
          actions={
            <Button
              disabled={networkMapQuery.isFetching}
              onClick={() => void networkMapQuery.refetch()}
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
          }
        />

        <div className="grid gap-3 md:grid-cols-4">
          <SummaryCard
            icon={<Network className="size-4" />}
            label={t("networkMap.subnets")}
            value={map?.subnets.length ?? 0}
          />
          <SummaryCard
            icon={<Server className="size-4" />}
            label={t("networkMap.servers")}
            value={serverNodes.length}
          />
          <SummaryCard
            icon={<LocateFixed className="size-4" />}
            label={t("statuses.ONLINE")}
            value={summary.online}
          />
          <SummaryCard
            icon={<ShieldQuestion className="size-4" />}
            label={t("networkMap.needsAttention")}
            value={summary.offline + summary.unknown}
          />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Network className="size-4" />
              {t("networkMap.topology")}
            </CardTitle>
            <CardDescription>{t("networkMap.topologyDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid gap-3 rounded-md border bg-muted/10 p-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_minmax(12rem,18rem)_auto] lg:items-end">
              <div className="grid gap-2">
                <Label htmlFor="network-map-search">{t("forms.search")}</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="network-map-search"
                    className="pl-8"
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={t("networkMap.searchPlaceholder")}
                    value={search}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="network-map-status">{t("forms.status")}</Label>
                <Select
                  onValueChange={(value) => setStatus(value as ServerStatus | "ALL")}
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
                <Select onValueChange={setSubnetId} value={subnetId}>
                  <SelectTrigger id="network-map-subnet" className="w-full">
                    <SelectValue placeholder={t("networkMap.allSubnets")} />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="ALL">{t("networkMap.allSubnets")}</SelectItem>
                    {(map?.subnets ?? []).map((subnet) => (
                      <SelectItem key={subnet.id} value={subnet.id}>
                        {subnet.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                disabled={!hasActiveFilters}
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                  setSubnetId("ALL");
                }}
                type="button"
                variant="outline"
              >
                <X className="size-4" />
                {t("actions.clear")}
              </Button>
            </div>

            {networkMapQuery.isLoading ? (
              <SectionState
                description={t("networkMap.loadingDescription")}
                icon={<Network className="size-6" />}
                title={`${t("common.loading")}...`}
              />
            ) : null}

            {networkMapQuery.isError ? (
              <SectionState
                action={
                  <Button onClick={() => void networkMapQuery.refetch()} variant="outline">
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
            ) : null}

            {networkMapQuery.isSuccess && serverNodes.length === 0 ? (
              <SectionState
                description={t("networkMap.emptyDescription")}
                icon={<Network className="size-6" />}
                title={t("networkMap.emptyTitle")}
              />
            ) : null}

            {networkMapQuery.isSuccess && serverNodes.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <LegendItem className="bg-emerald-400" label={t("statuses.ONLINE")} />
                    <LegendItem className="bg-rose-400" label={t("statuses.OFFLINE")} />
                    <LegendItem className="bg-amber-400" label={t("statuses.UNKNOWN")} />
                    <span className="inline-flex items-center gap-1">
                      <Cable className="size-3.5" />
                      {t("networkMap.inferredGateway")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label={t("networkMap.zoomOut")}
                      onClick={() => setZoom((current) => Math.max(0.75, current - 0.1))}
                      size="icon"
                      variant="outline"
                    >
                      <ZoomOut className="size-4" />
                    </Button>
                    <span className="w-14 text-center text-xs text-muted-foreground">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      aria-label={t("networkMap.zoomIn")}
                      onClick={() => setZoom((current) => Math.min(1.35, current + 0.1))}
                      size="icon"
                      variant="outline"
                    >
                      <ZoomIn className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
                  <TopologyCanvas
                    filteredNodeIds={filteredNodeIds}
                    nodes={map?.nodes ?? []}
                    onSelectNode={setSelectedNodeId}
                    selectedNodeId={selectedNode?.id ?? null}
                    subnets={map?.subnets ?? []}
                    zoom={zoom}
                  />
                  <NodeDetails node={selectedNode} />
                </div>

                <NodeTable nodes={filteredServerNodes} />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <div className="text-2xl font-semibold">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopologyCanvas({
  filteredNodeIds,
  nodes,
  onSelectNode,
  selectedNodeId,
  subnets,
  zoom,
}: {
  filteredNodeIds: Set<string>;
  nodes: NetworkMapNode[];
  onSelectNode: (id: string) => void;
  selectedNodeId: string | null;
  subnets: NetworkMapSubnet[];
  zoom: number;
}) {
  const t = useTranslations();

  return (
    <div className="min-h-[34rem] overflow-auto rounded-md border bg-[radial-gradient(circle_at_1px_1px,var(--border)_1px,transparent_0)] [background-size:24px_24px]">
      <div
        className="grid min-w-[44rem] gap-4 p-4 transition-transform"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          width: `${100 / zoom}%`,
        }}
      >
        {subnets.map((subnet) => {
          const subnetNodes = nodes.filter((node) => node.subnetId === subnet.id);
          const gateway = subnetNodes.find((node) => node.type === "GATEWAY");
          const servers = subnetNodes.filter((node) => node.type === "SERVER");

          return (
            <section
              className="rounded-md border bg-background/92 p-4 shadow-sm"
              key={subnet.id}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium">{subnet.label}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("networkMap.nodeCount", { count: subnet.nodeCount })}
                  </p>
                </div>
                <Badge variant="outline">{subnet.cidr}</Badge>
              </div>

              <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-center">
                {gateway ? (
                  <NodeButton
                    dimmed={false}
                    node={gateway}
                    onSelectNode={onSelectNode}
                    selected={selectedNodeId === gateway.id}
                  />
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {servers.map((node) => (
                    <NodeButton
                      dimmed={!filteredNodeIds.has(node.id)}
                      key={node.id}
                      node={node}
                      onSelectNode={onSelectNode}
                      selected={selectedNodeId === node.id}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function NodeButton({
  dimmed,
  node,
  onSelectNode,
  selected,
}: {
  dimmed: boolean;
  node: NetworkMapNode;
  onSelectNode: (id: string) => void;
  selected: boolean;
}) {
  const t = useTranslations();
  const Icon = node.type === "GATEWAY" ? Cable : Server;
  return (
    <button
      className={cn(
        "min-h-28 rounded-md border p-3 text-left shadow-sm transition hover:border-primary/60 hover:bg-muted/30",
        nodeStatusClasses[node.status],
        selected && "ring-2 ring-primary/70",
        dimmed && "opacity-35"
      )}
      onClick={() => onSelectNode(node.id)}
      type="button"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-background/70">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{node.name}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {node.ipAddress ?? t("common.notProvided")}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <ServerStatusBadge status={node.status} />
        {node.source === "INFERRED" ? (
          <Badge variant="outline">{t("networkMap.inferred")}</Badge>
        ) : null}
      </div>
    </button>
  );
}

function NodeDetails({ node }: { node: NetworkMapNode | null }) {
  const t = useTranslations();

  if (!node) {
    return (
      <div className="rounded-md border bg-muted/10 p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Info className="size-4" />
          {t("networkMap.nodeDetails")}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("networkMap.selectNode")}
        </p>
      </div>
    );
  }

  return (
    <aside className="rounded-md border bg-muted/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-medium">{node.name}</h2>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {node.ipAddress ?? t("common.unknown")}
          </p>
        </div>
        <ServerStatusBadge status={node.status} />
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
            `${port.protocol.toUpperCase()} ${port.port}${port.service ? ` ${port.service}` : ""}`
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
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 truncate font-mono text-xs">
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
            <Badge className="font-mono" key={item} variant="outline">
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/20 text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t("servers.nameHeader")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("forms.hostname")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("forms.ipAddress")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("forms.status")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("networkMap.services")}</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node) => (
              <tr className="border-t" key={node.id}>
                <td className="px-3 py-2 font-medium">{node.name}</td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {node.hostname ?? t("common.notProvided")}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {node.ipAddress ?? t("common.notProvided")}
                </td>
                <td className="px-3 py-2">
                  <ServerStatusBadge status={node.status} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {node.services.length > 0
                    ? node.services.map((service) => service.name).join(", ")
                    : t("common.none")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
