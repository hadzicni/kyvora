import type { NextRequest } from "next/server";

import {
  agentApiUnavailableResponse,
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../../_lib";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const backendUrl = new URL(
      `/api/v1/agents/${encodeURIComponent(id)}/rotate-token`,
      apiBaseUrl
    );

    const response = await backendFetch(request, backendUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return agentApiUnavailableResponse();
  }
}
