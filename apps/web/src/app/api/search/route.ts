import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib/backend";

function createBackendUrl(request: NextRequest) {
  const backendUrl = new URL("/api/v1/search", apiBaseUrl);
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
    return NextResponse.json(
      { message: "Unable to connect to the search API." },
      { status: 502 }
    );
  }
}
