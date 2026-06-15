import { apiRequest, ApiRequestError } from "@/lib/api/client";

export type DashboardSummary = {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  unknownServers: number;
  generatedAt: string;
};

export class DashboardApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "DashboardApiError";
  }
}

const request = <T>(path: string, init?: RequestInit) =>
  apiRequest<T>(
    path,
    init,
    (message, status, details) => new DashboardApiError(message, status, details)
  );

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>("/api/dashboard/summary");
}

export const dashboardKeys = {
  all: ["dashboard"] as const,
  summary: () => [...dashboardKeys.all, "summary"] as const,
};
