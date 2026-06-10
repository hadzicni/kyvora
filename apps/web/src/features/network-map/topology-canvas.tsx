"use client";

import { Cable, Server } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  type Edge,
  type Node,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";

import { Badge } from "@/components/ui/badge";
import { ServerStatusBadge } from "@/features/servers/server-status-badge";
import type {
  NetworkMapEdge,
  NetworkMapNode,
  NetworkMapSubnet,
} from "@/lib/api/network-map";
import type { ServerStatus } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const nodeStatusClasses: Record<ServerStatus, string> = {
  ONLINE: "border-emerald-400/50 bg-emerald-500/10 shadow-emerald-950/20",
  OFFLINE: "border-rose-400/50 bg-rose-500/10 shadow-rose-950/20",
  UNKNOWN: "border-amber-400/50 bg-amber-500/10 shadow-amber-950/20",
};

const nodeTypes = {
  gateway: GatewayFlowNode,
  server: ServerFlowNode,
  subnet: SubnetFlowNode,
};

type FlowNodeData = {
  networkNode?: NetworkMapNode;
  selected?: boolean;
  subnet?: NetworkMapSubnet;
  nodeCount?: number;
};

export function TopologyCanvas({
  className,
  edges,
  nodes,
  onSelectNode,
  selectedNodeId,
  subnets,
}: {
  className?: string;
  edges: NetworkMapEdge[];
  nodes: NetworkMapNode[];
  onSelectNode: (id: string) => void;
  selectedNodeId: string | null;
  subnets: NetworkMapSubnet[];
}) {
  const t = useTranslations();
  const flowNodes = useMemo(
    () => createFlowNodes({ nodes, selectedNodeId, subnets }),
    [nodes, selectedNodeId, subnets]
  );
  const flowEdges = useMemo(
    () => createFlowEdges({ edges, nodes, subnets }),
    [edges, nodes, subnets]
  );

  if (flowNodes.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[32rem] items-center justify-center bg-muted/10 p-6 text-center text-sm text-muted-foreground",
          className
        )}
      >
        {t("networkMap.noMatchesDescription")}
      </div>
    );
  }

  return (
    <ReactFlow
      className={cn("network-map-flow bg-background", className)}
      edges={flowEdges}
      fitView
      fitViewOptions={{ padding: 0.2, minZoom: 0.35, maxZoom: 1 }}
      maxZoom={1.8}
      minZoom={0.18}
      nodes={flowNodes}
      nodesConnectable={false}
      nodesDraggable={false}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => {
        if (node.data.networkNode) {
          onSelectNode(node.data.networkNode.id);
        }
      }}
      panOnDrag
      proOptions={{ hideAttribution: true }}
    >
      <Background color="var(--border)" gap={28} />
      <Controls position="bottom-right" showInteractive={false} />
      <MiniMap
        className="!hidden !border !border-border !bg-background/95 md:!block"
        maskColor="hsl(var(--background) / 0.65)"
        nodeColor={(node) => {
          if (node.type === "gateway") {
            return "#38bdf8";
          }

          if (node.type === "subnet") {
            return "#334155";
          }

          return "#64748b";
        }}
        pannable
        position="bottom-left"
        zoomable
      />
    </ReactFlow>
  );
}

function ServerFlowNode({ data }: NodeProps<FlowNodeData>) {
  const t = useTranslations();
  const node = data.networkNode;

  if (!node) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-56 rounded-md border p-3 text-left shadow-sm transition",
        nodeStatusClasses[node.status],
        data.selected && "ring-2 ring-primary/70"
      )}
    >
      <Handle className="opacity-0" position={Position.Left} type="target" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-background/70">
          <Server className="size-4" />
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
    </div>
  );
}

function GatewayFlowNode({ data }: NodeProps<FlowNodeData>) {
  const t = useTranslations();
  const node = data.networkNode;

  if (!node) {
    return null;
  }

  return (
    <div
      className={cn(
        "w-56 rounded-md border border-sky-400/40 bg-sky-500/10 p-3 text-left shadow-sm transition",
        data.selected && "ring-2 ring-primary/70"
      )}
    >
      <Handle className="opacity-0" position={Position.Right} type="source" />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-background/70">
          <Cable className="size-4" />
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
        <Badge variant="outline">{t("networkMap.inferred")}</Badge>
      </div>
    </div>
  );
}

function SubnetFlowNode({ data }: NodeProps<FlowNodeData>) {
  const t = useTranslations();
  const subnet = data.subnet;

  if (!subnet) {
    return null;
  }

  return (
    <div className="h-full rounded-lg border bg-card/75 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{subnet.label}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {subnet.cidr}
          </div>
        </div>
        <Badge variant="outline">
          {t("networkMap.nodeCount", { count: data.nodeCount ?? 0 })}
        </Badge>
      </div>
    </div>
  );
}

function createFlowNodes({
  nodes,
  selectedNodeId,
  subnets,
}: {
  nodes: NetworkMapNode[];
  selectedNodeId: string | null;
  subnets: NetworkMapSubnet[];
}): Node<FlowNodeData>[] {
  const flowNodes: Node<FlowNodeData>[] = [];
  const visibleSubnets = subnets
    .map((subnet) => ({
      subnet,
      nodes: nodes.filter((node) => node.subnetId === subnet.id),
    }))
    .filter((entry) => entry.nodes.some((node) => node.type === "SERVER"));
  const columns = Math.min(3, Math.max(1, Math.ceil(Math.sqrt(visibleSubnets.length))));

  visibleSubnets.forEach((entry, subnetIndex) => {
    const gateways = entry.nodes.filter((node) => node.type === "GATEWAY");
    const servers = entry.nodes.filter((node) => node.type === "SERVER");
    const rows = Math.max(gateways.length, Math.ceil(servers.length / 2), 1);
    const width = 700;
    const height = Math.max(300, 120 + rows * 150);
    const x = (subnetIndex % columns) * (width + 90);
    const y = Math.floor(subnetIndex / columns) * (height + 90);

    flowNodes.push({
      id: `subnet-${entry.subnet.id}`,
      type: "subnet",
      data: {
        subnet: entry.subnet,
        nodeCount: entry.nodes.length,
      },
      draggable: false,
      position: { x, y },
      selectable: false,
      style: { width, height },
      zIndex: 0,
    });

    gateways.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: "gateway",
        data: {
          networkNode: node,
          selected: selectedNodeId === node.id,
        },
        draggable: false,
        extent: "parent",
        parentNode: `subnet-${entry.subnet.id}`,
        position: {
          x: 36,
          y: 92 + index * 150,
        },
        zIndex: 1,
      });
    });

    servers.forEach((node, index) => {
      flowNodes.push({
        id: node.id,
        type: "server",
        data: {
          networkNode: node,
          selected: selectedNodeId === node.id,
        },
        draggable: false,
        extent: "parent",
        parentNode: `subnet-${entry.subnet.id}`,
        position: {
          x: 330 + (index % 2) * 250,
          y: 82 + Math.floor(index / 2) * 150,
        },
        zIndex: 1,
      });
    });
  });

  return flowNodes;
}

function createFlowEdges({
  edges,
  nodes,
  subnets,
}: {
  edges: NetworkMapEdge[];
  nodes: NetworkMapNode[];
  subnets: NetworkMapSubnet[];
}): Edge[] {
  const visibleIds = new Set(nodes.map((node) => node.id));
  const existingEdges = edges.filter(
    (edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)
  );

  if (existingEdges.length > 0) {
    return existingEdges.map(toFlowEdge);
  }

  return subnets.flatMap((subnet) => {
    const subnetNodes = nodes.filter((node) => node.subnetId === subnet.id);
    const gateway = subnetNodes.find((node) => node.type === "GATEWAY");
    const servers = subnetNodes.filter((node) => node.type === "SERVER");

    if (!gateway) {
      return [];
    }

    return servers.map((server) =>
      toFlowEdge({
        id: `${gateway.id}-${server.id}`,
        label: "",
        source: gateway.id,
        target: server.id,
      })
    );
  });
}

function toFlowEdge(edge: NetworkMapEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "var(--muted-foreground)",
      strokeWidth: 1.5,
    },
  };
}
