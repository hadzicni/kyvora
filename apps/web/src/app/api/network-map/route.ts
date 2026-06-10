import { NextResponse, type NextRequest } from "next/server";

import {
  apiBaseUrl,
  backendFetch,
  createBackendResponse,
} from "../_lib/backend";

function createBackendUrl() {
  return new URL("/api/v1/network-map", apiBaseUrl);
}

export async function GET(request: NextRequest) {
  try {
    const response = await backendFetch(request, createBackendUrl(), {
      headers: {
        Accept: "application/json",
      },
    });

    const body = await response.text();

    return createBackendResponse(response, body);
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the network map API." },
      { status: 502 }
    );
  }
}
