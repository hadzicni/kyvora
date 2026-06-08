import type { NextRequest } from "next/server";

import {
  agentApiUnavailableResponse,
  apiBaseUrl,
  createAuthorizationHeader,
  createBackendResponse,
} from "../_lib";

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(new URL("/api/v1/agents/register", apiBaseUrl), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...createAuthorizationHeader(),
      },
      body: await request.text(),
      cache: "no-store",
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return agentApiUnavailableResponse();
  }
}
