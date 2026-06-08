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
      new URL("/api/v1/agents/register", apiBaseUrl),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: await request.text(),
      }
    );

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return agentApiUnavailableResponse();
  }
}
