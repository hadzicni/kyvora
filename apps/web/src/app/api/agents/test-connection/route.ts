import type { NextRequest } from "next/server";

import {
  agentApiUnavailableResponse,
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib";

export async function POST(request: NextRequest) {
  try {
    const response = await backendFetch(
      request,
      new URL("/api/v1/agents/test-connection", apiBaseUrl),
      {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: await request.text(),
      }
    );
    return createBackendResponse(response, await response.text());
  } catch {
    return agentApiUnavailableResponse();
  }
}
