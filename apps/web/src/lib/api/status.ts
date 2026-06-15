import { apiRequest, ApiRequestError } from "@/lib/api/client";

export type KyvoraStatus = {
  service: string;
  version: string;
  generatedAt: string;
};

export class StatusApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "StatusApiError";
  }
}

export async function getStatus(): Promise<KyvoraStatus> {
  return apiRequest<KyvoraStatus>(
    "/api/status",
    undefined,
    (message, status, details) => new StatusApiError(message, status, details)
  );
}

export const statusKeys = {
  status: ["status"] as const,
};
