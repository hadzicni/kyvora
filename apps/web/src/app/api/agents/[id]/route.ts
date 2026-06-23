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
      request,
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

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const response = await backendFetch(
      request,
      new URL(`/api/v1/agents/${encodeURIComponent(id)}/connection`, apiBaseUrl),
      {
        method: "PUT",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: await request.text(),
      }
    );
    return createBackendResponse(response, await response.text());
  } catch {
    return agentApiUnavailableResponse();
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const response = await backendFetch(
      request,
      await createBackendUrl(request, context),
      { method: "DELETE", headers: { Accept: "application/json" } }
    );
    return createBackendResponse(response, await response.text());
  } catch {
    return agentApiUnavailableResponse();
  }
}
