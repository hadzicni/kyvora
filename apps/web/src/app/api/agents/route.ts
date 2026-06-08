import type { NextRequest } from "next/server";

import {
  agentApiUnavailableResponse,
  apiBaseUrl,
  createAuthorizationHeader,
  createBackendResponse,
} from "./_lib";

function createBackendUrl(request: NextRequest) {
  const backendUrl = new URL("/api/v1/agents", apiBaseUrl);
  backendUrl.search = request.nextUrl.search;

  return backendUrl;
}

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(createBackendUrl(request), {
      headers: {
        Accept: "application/json",
        ...createAuthorizationHeader(),
      },
      cache: "no-store",
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return agentApiUnavailableResponse();
  }
}
