import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib/backend";

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch(
      request,
      new URL("/api/v1/status", apiBaseUrl),
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the status API." },
      { status: 502 }
    );
  }
}
