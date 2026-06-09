import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../../_lib/backend";

export async function proxyUserAction(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
  action: "disable" | "enable" | "reset-password",
  body?: string
) {
  try {
    const { id } = await context.params;
    const response = await backendFetch(
      request,
      new URL(`/api/v1/users/${encodeURIComponent(id)}/${action}`, apiBaseUrl),
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        body,
      }
    );
    const responseBody = await response.text();

    return createBackendResponse(response, responseBody);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the users API." },
      { status: 502 }
    );
  }
}
