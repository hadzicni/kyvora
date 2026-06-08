import type { NextRequest } from "next/server";

import {
  agentApiUnavailableResponse,
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function createBackendUrl(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const backendUrl = new URL(
    `/api/v1/agents/${encodeURIComponent(id)}`,
    apiBaseUrl
  );
  backendUrl.search = request.nextUrl.search;

  return backendUrl;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const response = await backendFetch(
      await createBackendUrl(request, context),
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return agentApiUnavailableResponse();
  }
}
