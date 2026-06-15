import { apiRequest, appendSearchParam, ApiRequestError } from "@/lib/api/client";

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

export class SearchApiError extends ApiRequestError {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = []
  ) {
    super(message, status, details);
    this.name = "SearchApiError";
  }
}

export async function searchKyvora(
  params: SearchParams = {}
): Promise<SearchResponse> {
  const searchParams = new URLSearchParams();

  appendSearchParam(searchParams, "q", params.q?.trim());
  appendSearchParam(searchParams, "limit", params.limit ?? 12);

  return apiRequest<SearchResponse>(
    `/api/search?${searchParams.toString()}`,
    undefined,
    (message, status, details) => new SearchApiError(message, status, details)
  );
}

export const searchKeys = {
  all: ["search"] as const,
  query: (params: SearchParams = {}) => [...searchKeys.all, params] as const,
};
