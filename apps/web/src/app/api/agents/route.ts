import type { NextRequest } from "next/server";

import {
  agentApiUnavailableResponse,
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "./_lib";

function createBackendUrl(request: NextRequest) {
  const backendUrl = new URL("/api/v1/agents", apiBaseUrl);
  backendUrl.search = request.nextUrl.search;

  return backendUrl;
}

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch(request, createBackendUrl(request), {
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

export async function POST(request: NextRequest) {
  try {
    const response = await backendFetch(request, new URL("/api/v1/agents", apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: await request.text(),
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return agentApiUnavailableResponse();
  }
}
