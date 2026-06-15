export type SearchResultType =
  | "SERVER"
  | "SERVICE"
  | "AGENT"
  | "USER"
  | "ACTIVITY";

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  description: string | null;
  url: string;
  metadata: Record<string, unknown>;
  updatedAt: string;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  generatedAt: string;
};

export type SearchParams = {
  q?: string;
  limit?: number;
};

export class SearchApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message);
    this.name = "SearchApiError";
  }
}

function appendParam(searchParams: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  searchParams.append(key, String(value));
}

export async function searchKyvora(
  params: SearchParams = {}
): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();

  appendParam(searchParams, "q", params.q?.trim());
  appendParam(searchParams, "limit", params.limit ?? 12);

  const response = await fetch(`/api/search?${searchParams.toString()}`, {
    headers: {
      Accept: "application/json",
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

    throw new SearchApiError(message, response.status, details);
  }

  return (await response.json()) as SearchResponse;
}

export const searchKeys = {
  all: ["search"] as const,
  query: (params: SearchParams = {}) => [...searchKeys.all, params] as const,
};
