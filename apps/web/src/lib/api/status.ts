export type KyvoraStatus = {
  service: string;
  version: string;
  generatedAt: string;
};

export class StatusApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "StatusApiError";
  }
}

export async function getStatus(): Promise<KyvoraStatus> {
  const response = await fetch("/api/status", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { message?: string };
      message = body.message ?? message;
    } catch {
      // Keep the status-derived fallback if the response is not JSON.
    }
    throw new StatusApiError(message, response.status);
  }

  return (await response.json()) as KyvoraStatus;
}

export const statusKeys = {
  status: ["status"] as const,
};
