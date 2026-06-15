import { apiRequest, ApiRequestError } from "@/lib/api/client";
import type { ServerStatus } from "./servers";

export type NetworkMapNodeType = "SERVER" | "GATEWAY";
export type NetworkMapNodeSource = "INVENTORY" | "INFERRED";

export type NetworkMapPort = {
  port: number;
  protocol: string;
  service: string | null;
};

export type NetworkMapService = {
  name: string;
  protocol: string | null;
  port: number | null;
};

export type NetworkMapSubnet = {
  id: string;
  cidr: string;
  label: string;
  nodeCount: number;
};

export type NetworkMapNode = {
  id: string;
  type: NetworkMapNodeType;
  source: NetworkMapNodeSource;
  subnetId: string;
  serverId: string | null;
  name: string;
  hostname: string | null;
  ipAddress: string | null;
  dnsName: string | null;
  status: ServerStatus;
  operatingSystem: string | null;
  ipAddresses: string[];
  tags: string[];
  openPorts: NetworkMapPort[];
  services: NetworkMapService[];
  lastSeenAt: string | null;
};

export type NetworkMapEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
};

export type NetworkMap = {
  subnets: NetworkMapSubnet[];
  nodes: NetworkMapNode[];
  edges: NetworkMapEdge[];
  generatedAt: string;
};

export class NetworkMapApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "NetworkMapApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new NetworkMapApiError(message, status, details)
  );

export async function getNetworkMap(): Promise<NetworkMap> {
  return request<NetworkMap>("/api/network-map");
}

export const networkMapKeys = {
  all: ["network-map"] as const,
  detail: () => [...networkMapKeys.all, "detail"] as const,
};
