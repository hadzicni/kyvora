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

export class NetworkMapApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "NetworkMapApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let details: string[] = [];

    try {
      const body = (await response.json()) as {
        message?: string;
        details?: string[];
      };
      message = body.message ?? message;
      details = Array.isArray(body.details) ? body.details : [];
    } catch {
      // Keep the status-derived fallback if the response is not JSON.
    }

    throw new NetworkMapApiError(message, response.status, details);
  }

  const body = await response.text();

  if (!body) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
}

export async function getNetworkMap(): Promise<NetworkMap> {
  return request<NetworkMap>("/api/network-map");
}

export const networkMapKeys = {
  all: ["network-map"] as const,
  detail: () => [...networkMapKeys.all, "detail"] as const,
};
